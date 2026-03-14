import { PrismaClient, ActivityType, GroupType, FriendshipStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.crossroads" },
    update: {},
    create: {
      email: "alice@demo.crossroads",
      name: "Alice Chen",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      calendarConnected: true,
      locationSharingEnabled: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.crossroads" },
    update: {},
    create: {
      email: "bob@demo.crossroads",
      name: "Bob Kumar",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      calendarConnected: true,
      locationSharingEnabled: true,
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@demo.crossroads" },
    update: {},
    create: {
      email: "carol@demo.crossroads",
      name: "Carol Smith",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      calendarConnected: false,
      locationSharingEnabled: false,
    },
  });

  // Friendships
  await prisma.friendship.upsert({
    where: { requesterId_addresseeId: { requesterId: alice.id, addresseeId: bob.id } },
    update: { status: "ACCEPTED" },
    create: { requesterId: alice.id, addresseeId: bob.id, status: "ACCEPTED" },
  });

  await prisma.friendship.upsert({
    where: { requesterId_addresseeId: { requesterId: alice.id, addresseeId: carol.id } },
    update: { status: "ACCEPTED" },
    create: { requesterId: alice.id, addresseeId: carol.id, status: "ACCEPTED" },
  });

  // Locations — same campus
  await prisma.userLocation.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      latitude: 43.4723,
      longitude: -80.5449,
      label: "Campus",
    },
  });

  await prisma.userLocation.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      latitude: 43.4731,
      longitude: -80.5441,
      label: "Campus",
    },
  });

  // Activity preferences
  const aliceActivities: ActivityType[] = ["COFFEE", "STUDY", "HANGOUT"];
  const bobActivities: ActivityType[] = ["GYM", "COFFEE", "EAT"];

  for (const a of aliceActivities) {
    await prisma.activityPreference.upsert({
      where: { userId_activity: { userId: alice.id, activity: a } },
      update: {},
      create: { userId: alice.id, activity: a, weight: 1.0 },
    });
  }

  for (const a of bobActivities) {
    await prisma.activityPreference.upsert({
      where: { userId_activity: { userId: bob.id, activity: a } },
      update: {},
      create: { userId: bob.id, activity: a, weight: 1.0 },
    });
  }

  // Availability blocks (next 48h)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Alice: free 2pm-6pm today, 10am-12pm tomorrow
  const aliceBlocks = [
    {
      startTime: new Date(now.toDateString() + " 14:00"),
      endTime: new Date(now.toDateString() + " 18:00"),
    },
    {
      startTime: new Date(tomorrow.toDateString() + " 10:00"),
      endTime: new Date(tomorrow.toDateString() + " 12:00"),
    },
  ];

  // Bob: free 3pm-7pm today, 10am-1pm tomorrow
  const bobBlocks = [
    {
      startTime: new Date(now.toDateString() + " 15:00"),
      endTime: new Date(now.toDateString() + " 19:00"),
    },
    {
      startTime: new Date(tomorrow.toDateString() + " 10:00"),
      endTime: new Date(tomorrow.toDateString() + " 13:00"),
    },
  ];

  await prisma.availabilityBlock.deleteMany({
    where: { userId: { in: [alice.id, bob.id] } },
  });

  await prisma.availabilityBlock.createMany({
    data: [
      ...aliceBlocks.map((b) => ({ userId: alice.id, ...b })),
      ...bobBlocks.map((b) => ({ userId: bob.id, ...b })),
    ],
  });

  // Study group
  const group = await prisma.group.create({
    data: {
      name: "CS246 Study Group",
      type: "STUDY" as GroupType,
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "MEMBER" },
          { userId: carol.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Demo suggestion for alice
  await prisma.suggestion.create({
    data: {
      forUserId: alice.id,
      activity: "COFFEE",
      participantIds: [alice.id, bob.id],
      startTime: new Date(now.toDateString() + " 15:00"),
      durationMinutes: 45,
      location: "Campus coffee shop",
      reason: "Alice and Bob are both free at 3pm and both enjoy coffee — and they're on the same campus.",
      confidence: 0.87,
      status: "PENDING",
    },
  });

  console.log("Seed complete. Users:", { alice: alice.id, bob: bob.id, carol: carol.id });
  console.log("Group:", group.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
