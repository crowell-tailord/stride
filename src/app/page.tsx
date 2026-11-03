import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { dataStore } from "@/lib/db/json-store";
import StrideWorkspace from "@/components/board/StrideWorkspace";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const allBoards = await dataStore.getBoards(session.id);
  const currentBoard = allBoards[0];

  if (!currentBoard) {
    // If no board exists, create a default one
    const newBoard = await dataStore.createBoard({
      title: "My First Board",
      description: "Default workspace board",
      background: "ocean",
      allowedUserIds: [session.id, "usr_client"],
    });
    await dataStore.createList(newBoard.id, "To Do");
    await dataStore.createList(newBoard.id, "In Progress");
    await dataStore.createList(newBoard.id, "Done");
    redirect("/");
  }

  const lists = await dataStore.getLists(currentBoard.id);
  const cards = await dataStore.getCards(currentBoard.id);
  const labels = await dataStore.getLabels(currentBoard.id);

  return (
    <StrideWorkspace
      currentUser={session}
      initialBoard={currentBoard}
      allBoards={allBoards}
      initialLists={lists}
      initialCards={cards}
      initialLabels={labels}
    />
  );
}
