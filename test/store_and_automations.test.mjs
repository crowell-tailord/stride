import test from "node:test";
import assert from "node:assert/strict";
import { dataStore } from "../src/lib/db/json-store.ts";
import { dispatchBoardEvent } from "../src/lib/automations/engine.ts";

test("JSON Store: initial seed data and atomic operations", async () => {
  const users = await dataStore.getUsers();
  assert.equal(users.length, 2);
  assert.equal(users[0].role, "owner");
  assert.equal(users[1].role, "client");

  const boards = await dataStore.getBoards();
  assert.ok(boards.length >= 1);
  const welcomeBoard = boards.find((b) => b.id === "board_welcome");
  assert.ok(welcomeBoard);
  assert.equal(welcomeBoard.title, "Client Project Roadmap");

  const lists = await dataStore.getLists(welcomeBoard.id);
  assert.equal(lists.length, 4);

  const cards = await dataStore.getCards(welcomeBoard.id);
  assert.ok(cards.length >= 4);
});

test("Automations Engine: triggers auto-completion when card moved to 'Completed & Shipped'", async () => {
  const boards = await dataStore.getBoards();
  const welcomeBoard = boards.find((b) => b.id === "board_welcome");
  assert.ok(welcomeBoard);

  const lists = await dataStore.getLists(welcomeBoard.id);
  const inProgressList = lists.find((l) => l.title === "In Progress");
  const doneList = lists.find((l) => l.title === "Completed & Shipped");
  assert.ok(inProgressList && doneList);

  // Create a new card in Progress
  const newCard = await dataStore.createCard(
    welcomeBoard.id,
    inProgressList.id,
    "Automated task verification",
    "Testing Butler rule execution"
  );
  assert.equal(newCard.isCompleted, false);

  // Dispatch event simulating drag into 'Completed & Shipped'
  const updatedCard = await dispatchBoardEvent({
    type: "CARD_MOVED",
    cardId: newCard.id,
    fromListTitle: inProgressList.title,
    toListTitle: doneList.title,
  });

  assert.ok(updatedCard);
  assert.equal(updatedCard.isCompleted, true);
  // Verify system comment was appended
  const botComment = updatedCard.comments.find((c) => c.authorId === "stride_bot");
  assert.ok(botComment);
  assert.match(botComment.text, /automatically marked as complete/);
});

test("Custom Fields: configure board fields and card values", async () => {
  const boards = await dataStore.getBoards();
  const welcomeBoard = boards[0];

  // Update board with a custom field
  const customField = {
    id: "fld_budget",
    boardId: welcomeBoard.id,
    name: "Budget ($)",
    type: "number",
    showOnFront: true,
  };

  const updatedBoard = await dataStore.updateBoard(welcomeBoard.id, {
    customFields: [
      ...(welcomeBoard.customFields || []).filter((f) => f.id !== "fld_budget"),
      customField,
    ],
  });

  assert.ok(updatedBoard);
  assert.ok(updatedBoard.customFields.some((f) => f.id === "fld_budget"));

  // Create card with custom field values
  const cards = await dataStore.getCards(welcomeBoard.id);
  const card = cards[0];

  const updatedCard = await dataStore.updateCard(card.id, {
    customFieldValues: {
      ...card.customFieldValues,
      fld_budget: 1500,
    },
  });

  assert.ok(updatedCard);
  assert.equal(updatedCard.customFieldValues.fld_budget, 1500);
});

test("Board backgroundImageUrl: configure and persist custom background image", async () => {
  const boards = await dataStore.getBoards();
  const welcomeBoard = boards[0];

  const testBgUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
  const updated = await dataStore.updateBoard(welcomeBoard.id, {
    backgroundImageUrl: testBgUrl,
  });

  assert.ok(updated);
  assert.equal(updated.backgroundImageUrl, testBgUrl);

  const fetched = await dataStore.getBoard(welcomeBoard.id);
  assert.equal(fetched?.backgroundImageUrl, testBgUrl);

  // Clear background image with null
  const cleared = await dataStore.updateBoard(welcomeBoard.id, {
    backgroundImageUrl: null,
  });
  assert.equal(cleared?.backgroundImageUrl, undefined);

  const fetchedCleared = await dataStore.getBoard(welcomeBoard.id);
  assert.equal(fetchedCleared?.backgroundImageUrl, undefined);

  // Set again then clear with empty string
  await dataStore.updateBoard(welcomeBoard.id, {
    backgroundImageUrl: testBgUrl,
  });
  const clearedEmpty = await dataStore.updateBoard(welcomeBoard.id, {
    backgroundImageUrl: "",
  });
  assert.equal(clearedEmpty?.backgroundImageUrl, undefined);
  const fetchedClearedEmpty = await dataStore.getBoard(welcomeBoard.id);
  assert.equal(fetchedClearedEmpty?.backgroundImageUrl, undefined);
});

test("Labels: create, update, and delete label with card reference cleanup", async () => {
  const boards = await dataStore.getBoards();
  const welcomeBoard = boards[0];

  // 1. Create label
  const label = await dataStore.createLabel(welcomeBoard.id, "Urgent Review", "rose");
  assert.ok(label.id);
  assert.equal(label.name, "Urgent Review");
  assert.equal(label.color, "rose");

  // 2. Update label
  const updatedLabel = await dataStore.updateLabel(label.id, {
    name: "Urgent Review (Updated)",
    color: "amber",
  });
  assert.ok(updatedLabel);
  assert.equal(updatedLabel.name, "Urgent Review (Updated)");
  assert.equal(updatedLabel.color, "amber");

  // 3. Attach label to a card
  const cards = await dataStore.getCards(welcomeBoard.id);
  const card = cards[0];
  const initialLabelIds = card.labelIds || [];
  await dataStore.updateCard(card.id, {
    labelIds: [...initialLabelIds, label.id],
  });

  const cardWithLabel = await dataStore.getCardById(card.id);
  assert.ok(cardWithLabel?.labelIds.includes(label.id));

  // 4. Delete label and verify it is removed from database and cards
  const deleted = await dataStore.deleteLabel(label.id);
  assert.equal(deleted, true);

  const labelsAfterDelete = await dataStore.getLabels(welcomeBoard.id);
  assert.ok(!labelsAfterDelete.some((l) => l.id === label.id));

  const cardAfterDelete = await dataStore.getCardById(card.id);
  assert.ok(!cardAfterDelete?.labelIds.includes(label.id));
});

test("Checklist items: hide/show completed items logic", () => {
  const checklist = [
    { id: "1", text: "Buy milk", isDone: true },
    { id: "2", text: "Write documentation", isDone: false },
    { id: "3", text: "Ship feature", isDone: true },
    { id: "4", text: "Celebrate", isDone: false },
  ];

  const totalChecks = checklist.length;
  const completedChecks = checklist.filter((c) => c.isDone).length;
  assert.equal(totalChecks, 4);
  assert.equal(completedChecks, 2);

  // When hideCompleted is false
  let hideCompleted = false;
  let visibleItems = hideCompleted ? checklist.filter((c) => !c.isDone) : checklist;
  assert.equal(visibleItems.length, 4);

  // When hideCompleted is true
  hideCompleted = true;
  visibleItems = hideCompleted ? checklist.filter((c) => !c.isDone) : checklist;
  assert.equal(visibleItems.length, 2);
  assert.deepEqual(
    visibleItems.map((i) => i.id),
    ["2", "4"]
  );
});
