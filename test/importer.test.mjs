import test from "node:test";
import assert from "node:assert/strict";
import { parseTrelloExport } from "../src/lib/importer/trello.ts";

test("Trello Importer: accurately parses board, lists, cards, checklists and labels", () => {
  const sampleTrelloJson = {
    name: "Marketing & Product Launch",
    desc: "Q4 Launch Strategy",
    prefs: {
      background: "blue",
    },
    lists: [
      { id: "tl_1", name: "To Do", closed: false, pos: 1000 },
      { id: "tl_2", name: "In Progress", closed: false, pos: 2000 },
      { id: "tl_closed", name: "Archived List", closed: true, pos: 3000 },
    ],
    labels: [
      { id: "tlabel_1", name: "High Priority", color: "red" },
      { id: "tlabel_2", name: "Design Asset", color: "green" },
    ],
    cards: [
      {
        id: "tcard_1",
        idList: "tl_1",
        name: "Create Launch Video",
        desc: "Script and produce teaser video",
        due: "2026-12-01T12:00:00.000Z",
        dueComplete: false,
        closed: false,
        pos: 1000,
        idLabels: ["tlabel_1"],
      },
      {
        id: "tcard_2",
        idList: "tl_2",
        name: "Update Documentation",
        desc: "Revise getting started guides",
        due: null,
        dueComplete: true,
        closed: false,
        pos: 1000,
        idLabels: ["tlabel_2"],
      },
    ],
    checklists: [
      {
        id: "tchk_1",
        idCard: "tcard_1",
        name: "Video Milestones",
        checkItems: [
          { id: "ti_1", name: "Storyboard approval", state: "complete", pos: 1 },
          { id: "ti_2", name: "Voiceover recording", state: "incomplete", pos: 2 },
        ],
      },
    ],
  };

  const result = parseTrelloExport(sampleTrelloJson, "usr_owner");

  // Verify board details
  assert.equal(result.board.title, "Marketing & Product Launch");
  assert.equal(result.board.description, "Q4 Launch Strategy");
  assert.equal(result.board.background, "ocean");

  // Verify lists (closed list excluded)
  assert.equal(result.lists.length, 2);
  assert.equal(result.lists[0].title, "To Do");
  assert.equal(result.lists[1].title, "In Progress");

  // Verify labels
  assert.equal(result.labels.length, 2);
  assert.equal(result.labels[0].name, "High Priority");
  assert.equal(result.labels[0].color, "rose"); // Red mapped to rose

  // Verify cards
  assert.equal(result.cards.length, 2);
  const card1 = result.cards.find((c) => c.title === "Create Launch Video");
  assert.ok(card1);
  assert.equal(card1.description, "Script and produce teaser video");
  assert.equal(card1.checklist.length, 2);
  assert.equal(card1.checklist[0].text, "Storyboard approval");
  assert.equal(card1.checklist[0].isDone, true);
  assert.equal(card1.checklist[1].text, "Voiceover recording");
  assert.equal(card1.checklist[1].isDone, false);
  assert.equal(card1.labelIds.length, 1);

  // Summary counts
  assert.equal(result.summary.listCount, 2);
  assert.equal(result.summary.cardCount, 2);
  assert.equal(result.summary.checklistCount, 2);
});
