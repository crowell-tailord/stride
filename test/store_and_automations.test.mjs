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
