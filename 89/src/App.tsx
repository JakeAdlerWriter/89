import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { StarField } from './components/StarField';
import { Button } from './components/ui/button';
import { RotateCw, MoveLeft, MoveRight, MoveDown, Play, Pause } from 'lucide-react';

// Tetromino shapes
const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#14F195',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#9945FF',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#00FFA3',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#14F195',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#9945FF',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#00FFA3',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#14F195',
  },
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

type TetrominoType = keyof typeof TETROMINOS;
type Board = (string | null)[][];
type Position = { x: number; y: number };

interface Piece {
  shape: number[][];
  color: string;
  position: Position;
}

const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
};

const randomTetromino = (): { shape: number[][]; color: string } => {
  const keys = Object.keys(TETROMINOS) as TetrominoType[];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return TETROMINOS[randomKey];
};

export default function App() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<{ shape: number[][]; color: string }>(randomTetromino());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const createNewPiece = useCallback((): Piece => {
    const tetromino = nextPiece;
    setNextPiece(randomTetromino());
    return {
      shape: tetromino.shape,
      color: tetromino.color,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
    };
  }, [nextPiece]);

  const collides = useCallback((piece: Piece, board: Board, position: Position): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const mergePieceToBoard = useCallback((piece: Piece, board: Board): Board => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: Board): { newBoard: Board; linesCleared: number } => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    return { newBoard, linesCleared };
  }, []);

  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return rotated;
  }, []);

  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return;

    const newPosition = { ...currentPiece.position };
    if (direction === 'left') newPosition.x--;
    if (direction === 'right') newPosition.x++;
    if (direction === 'down') newPosition.y++;

    if (!collides(currentPiece, board, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
    } else if (direction === 'down') {
      // Lock the piece
      const mergedBoard = mergePieceToBoard(currentPiece, board);
      const { newBoard, linesCleared: cleared } = clearLines(mergedBoard);
      
      setBoard(newBoard);
      setLinesCleared(prev => prev + cleared);
      setScore(prev => prev + cleared * 100 * level);
      setLevel(Math.floor((linesCleared + cleared) / 10) + 1);
      
      const newPiece = createNewPiece();
      if (collides(newPiece, newBoard, newPiece.position)) {
        setGameOver(true);
      } else {
        setCurrentPiece(newPiece);
      }
    }
  }, [currentPiece, board, gameOver, isPaused, gameStarted, collides, mergePieceToBoard, clearLines, createNewPiece, level, linesCleared]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return;

    const rotated = rotatePiece(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!collides(rotatedPiece, board, currentPiece.position)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, gameOver, isPaused, gameStarted, collides, rotatePiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !gameStarted) return;

    let newY = currentPiece.position.y;
    while (!collides(currentPiece, board, { x: currentPiece.position.x, y: newY + 1 })) {
      newY++;
    }

    const droppedPiece = { ...currentPiece, position: { ...currentPiece.position, y: newY } };
    const mergedBoard = mergePieceToBoard(droppedPiece, board);
    const { newBoard, linesCleared: cleared } = clearLines(mergedBoard);
    
    setBoard(newBoard);
    setLinesCleared(prev => prev + cleared);
    setScore(prev => prev + cleared * 100 * level + (newY - currentPiece.position.y) * 2);
    setLevel(Math.floor((linesCleared + cleared) / 10) + 1);
    
    const newPiece = createNewPiece();
    if (collides(newPiece, newBoard, newPiece.position)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, gameOver, isPaused, gameStarted, collides, mergePieceToBoard, clearLines, createNewPiece, level, linesCleared]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    const newPiece = createNewPiece();
    setCurrentPiece(newPiece);
  };

  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(prev => !prev);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      
      if (isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotate, hardDrop, gameStarted, gameOver, isPaused, togglePause]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const speed = Math.max(200, INITIAL_SPEED - (level - 1) * 100);
    const interval = setInterval(() => {
      movePiece('down');
    }, speed);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, level, movePiece]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
      <StarField />
      <div className="flex flex-col items-center gap-8 relative z-10">
        <h1 className="text-white text-center tracking-wider" style={{ fontSize: '3rem' }}>
          COSMIC TETRIS
        </h1>

        <div className="flex gap-8 items-start">
          {/* Left Panel - Score & Info */}
          <div className="flex flex-col gap-4 w-48">
            <div className="bg-zinc-900 border-2 border-purple-500 p-4 rounded-lg">
              <div className="text-purple-400 mb-2">SCORE</div>
              <div className="text-white text-2xl">{score}</div>
            </div>

            <div className="bg-zinc-900 border-2 border-green-400 p-4 rounded-lg">
              <div className="text-green-400 mb-2">LEVEL</div>
              <div className="text-white text-2xl">{level}</div>
            </div>

            <div className="bg-zinc-900 border-2 border-purple-500 p-4 rounded-lg">
              <div className="text-purple-400 mb-2">LINES</div>
              <div className="text-white text-2xl">{linesCleared}</div>
            </div>

            <div className="bg-zinc-900 border-2 border-green-400 p-4 rounded-lg">
              <div className="text-green-400 mb-2">NEXT</div>
              <div className="flex justify-center items-center h-16">
                {nextPiece.shape.map((row, y) => (
                  <div key={y} className="flex flex-col">
                    {nextPiece.shape.map((r, yy) => (
                      <div key={yy} className="flex">
                        {r.map((cell, xx) => (
                          <div
                            key={xx}
                            className="w-4 h-4 border border-zinc-800"
                            style={{
                              backgroundColor: cell ? nextPiece.color : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="relative">
            <GameBoard board={board} currentPiece={currentPiece} />
            
            {!gameStarted && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <Button
                  onClick={startGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-xl"
                >
                  <Play className="mr-2 h-6 w-6" />
                  START GAME
                </Button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <div className="text-white text-3xl mb-4">GAME OVER</div>
                <div className="text-green-400 text-xl mb-4">Score: {score}</div>
                <Button
                  onClick={startGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4"
                >
                  <Play className="mr-2 h-5 w-5" />
                  PLAY AGAIN
                </Button>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-white text-3xl">PAUSED</div>
              </div>
            )}
          </div>

          {/* Right Panel - Controls */}
          <div className="flex flex-col gap-4 w-48">
            <div className="bg-zinc-900 border-2 border-green-400 p-4 rounded-lg">
              <div className="text-green-400 mb-3">CONTROLS</div>
              <div className="text-white text-sm space-y-2">
                <div>← → Move</div>
                <div>↑ Rotate</div>
                <div>↓ Soft Drop</div>
                <div>SPACE Hard Drop</div>
                <div>P Pause</div>
              </div>
            </div>

            {gameStarted && (
              <Button
                onClick={togglePause}
                className="bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-purple-500"
              >
                {isPaused ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    RESUME
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    PAUSE
                  </>
                )}
              </Button>
            )}

            <div className="bg-zinc-900 border-2 border-purple-500 p-4 rounded-lg mt-4">
              <div className="text-purple-400 mb-3">MOBILE</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-start-2">
                  <Button
                    onClick={rotate}
                    disabled={!gameStarted || gameOver || isPaused}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 p-2"
                    size="sm"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => movePiece('left')}
                  disabled={!gameStarted || gameOver || isPaused}
                  className="bg-zinc-800 hover:bg-zinc-700 p-2"
                  size="sm"
                >
                  <MoveLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => movePiece('down')}
                  disabled={!gameStarted || gameOver || isPaused}
                  className="bg-zinc-800 hover:bg-zinc-700 p-2"
                  size="sm"
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => movePiece('right')}
                  disabled={!gameStarted || gameOver || isPaused}
                  className="bg-zinc-800 hover:bg-zinc-700 p-2"
                  size="sm"
                >
                  <MoveRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
