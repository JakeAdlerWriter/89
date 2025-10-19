interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  color: string;
  position: Position;
}

interface GameBoardProps {
  board: (string | null)[][];
  currentPiece: Piece | null;
}

export function GameBoard({ board, currentPiece }: GameBoardProps) {
  const renderBoard = () => {
    // Create a copy of the board with the current piece overlaid
    const displayBoard = board.map(row => [...row]);

    // Add current piece to the display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="bg-zinc-900 border-4 border-purple-500 p-2 rounded-lg shadow-2xl shadow-purple-500/20">
      <div className="grid gap-px bg-zinc-950 p-1">
        {displayBoard.map((row, y) => (
          <div key={y} className="flex gap-px">
            {row.map((cell, x) => (
              <div
                key={x}
                className="w-6 h-6 border border-zinc-800 rounded-sm transition-colors duration-100"
                style={{
                  backgroundColor: cell || '#0a0a0a',
                  boxShadow: cell ? `0 0 10px ${cell}40` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
