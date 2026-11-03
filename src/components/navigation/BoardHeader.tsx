'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Board, SessionUser } from '@/types/stride';
import {
	ChevronDown,
	UploadCloud,
	Plus,
	LogOut,
	Star,
	Check,
	Shield,
	User as UserIcon,
	Settings,
} from 'lucide-react';
import TrelloImportModal from '../board/TrelloImportModal';
import NewBoardModal from '../board/NewBoardModal';
import BoardSettingsModal from '../board/BoardSettingsModal';
import { version } from '../../../package.json';

interface BoardHeaderProps {
	currentBoard: Board;
	allBoards: Board[];
	currentUser: SessionUser;
	onSelectBoard: (boardId: string) => void;
	onBoardCreatedOrImported: (newBoard: Board) => void;
	onUpdateBoard: (updatedBoard: Board) => void;
}

export default function BoardHeader({
	currentBoard,
	allBoards,
	currentUser,
	onSelectBoard,
	onBoardCreatedOrImported,
	onUpdateBoard,
}: BoardHeaderProps) {
	const router = useRouter();
	const [showBoardDropdown, setShowBoardDropdown] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showNewBoardModal, setShowNewBoardModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [isStarred, setIsStarred] = useState(currentBoard.isStarred || false);

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.push('/login');
		router.refresh();
	};

	const handleToggleStar = async () => {
		const nextVal = !isStarred;
		setIsStarred(nextVal);
		await fetch(`/api/boards/${currentBoard.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isStarred: nextVal }),
		});
	};

	return (
		<header className='relative z-20 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between gap-4'>
			{/* Left: Brand & Board Switcher */}
			<div className='flex items-center gap-4'>
				{/* Brand */}
				<div className='flex items-center gap-2'>
					<div className='w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-sm'>
						S
					</div>
					<span className='font-extrabold text-white text-base tracking-tight hidden sm:inline'>
						Stride
					</span>
					<span className='text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60 hidden sm:inline'>
						v{version}
					</span>
				</div>

				<div className='h-5 w-px bg-slate-800 hidden sm:block' />

				{/* Board Switcher Dropdown */}
				<div className='relative'>
					<button
						type='button'
						onClick={() => setShowBoardDropdown(!showBoardDropdown)}
						className='flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sm font-semibold text-white transition-all shadow-sm'
					>
						<span className='truncate max-w-[180px] sm:max-w-xs'>
							{currentBoard.title}
						</span>
						<ChevronDown className='w-4 h-4 text-slate-400 shrink-0' />
					</button>

					{showBoardDropdown && (
						<div className='absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-40 animate-in fade-in'>
							<div className='px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
								Your Boards
							</div>
							<div className='space-y-1 max-h-56 overflow-y-auto'>
								{allBoards.map((b) => (
									<button
										key={b.id}
										type='button'
										onClick={() => {
											onSelectBoard(b.id);
											setShowBoardDropdown(false);
										}}
										className={`w-full px-3 py-2 text-xs font-medium text-left rounded-xl flex items-center justify-between transition-colors ${
											b.id === currentBoard.id
												? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
												: 'text-slate-300 hover:text-white hover:bg-slate-800'
										}`}
									>
										<span className='truncate'>{b.title}</span>
										{b.id === currentBoard.id && (
											<Check className='w-4 h-4 text-indigo-400' />
										)}
									</button>
								))}
							</div>

							<div className='my-1.5 border-t border-slate-800' />

							<div className='grid grid-cols-2 gap-1.5 pt-1'>
								<button
									type='button'
									onClick={() => {
										setShowBoardDropdown(false);
										setShowNewBoardModal(true);
									}}
									className='px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors border border-slate-800'
								>
									<Plus className='w-3.5 h-3.5 text-indigo-400' />
									New Board
								</button>
								<button
									type='button'
									onClick={() => {
										setShowBoardDropdown(false);
										setShowImportModal(true);
									}}
									className='px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors border border-indigo-500/30'
								>
									<UploadCloud className='w-3.5 h-3.5' />
									Import JSON
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Favorite / Star Button */}
				<button
					type='button'
					onClick={handleToggleStar}
					className={`p-1.5 rounded-xl transition-colors ${
						isStarred
							? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
							: 'text-slate-500 hover:text-slate-300 hover:bg-slate-850'
					}`}
					title='Star board'
				>
					<Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
				</button>

				{/* Board Settings & Custom Fields Button */}
				<button
					type='button'
					onClick={() => setShowSettingsModal(true)}
					className='px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm'
					title='Board Settings & Custom Fields'
				>
					<Settings className='w-3.5 h-3.5 text-indigo-400' />
					<span className='hidden sm:inline'>Settings</span>
				</button>
			</div>

			{/* Right: Actions, User Role & Logout */}
			<div className='flex items-center gap-3'>
				{/* Quick Import Trello Button */}
				<button
					type='button'
					onClick={() => setShowImportModal(true)}
					className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm'
				>
					<UploadCloud className='w-3.5 h-3.5' />
					<span>Import Trello</span>
				</button>

				{/* User Pill */}
				<div className='flex items-center gap-2 pl-2 border-l border-slate-800'>
					<div className='flex items-center gap-1.5'>
						<div className='w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300'>
							{currentUser.role === 'owner' ? (
								<Shield className='w-3.5 h-3.5 text-indigo-400' />
							) : (
								<UserIcon className='w-3.5 h-3.5 text-emerald-400' />
							)}
						</div>
						<div className='hidden md:block text-left'>
							<div className='text-xs font-bold text-white leading-tight'>
								{currentUser.name}
							</div>
							<div className='text-[10px] text-slate-400 capitalize'>
								{currentUser.role}
							</div>
						</div>
					</div>

					<button
						type='button'
						onClick={handleLogout}
						className='p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-850 transition-colors'
						title='Log out of private session'
					>
						<LogOut className='w-4 h-4' />
					</button>
				</div>
			</div>

			{/* Modals */}
			<TrelloImportModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
				onImportSuccess={(newBoard) => {
					onBoardCreatedOrImported(newBoard);
				}}
			/>

			<NewBoardModal
				isOpen={showNewBoardModal}
				onClose={() => setShowNewBoardModal(false)}
				onCreateSuccess={(newBoard) => {
					onBoardCreatedOrImported(newBoard);
				}}
			/>

			<BoardSettingsModal
				key={currentBoard.id}
				isOpen={showSettingsModal}
				board={currentBoard}
				onClose={() => setShowSettingsModal(false)}
				onUpdateBoard={(updated) => {
					onUpdateBoard(updated);
				}}
			/>
		</header>
	);
}
