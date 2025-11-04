import { useState, useRef } from 'react';
import styles from './app.module.css';

const TIMEOUT_DURATION = 3000;
// 定义单元格状态类型
type CellStatus = 'unselected' | 'selected' | 'excluded';

const Help = (props: {toggleShowHelp: () => void}) => {
  const {toggleShowHelp} = props;


  return (
    <div className={styles['dialog-overlay']}>
      <div className={styles['dialog-content']}>
        <div className={styles['help-content']}>
        <h4>如何使用数学探险工具</h4>
          <h5>加法</h5>
          <p>在同一行中点击或滑动选择多个格子，这代表把这些数字加起来。</p>
          <h5>乘法</h5>
          <p>选择多行多列的格子，这代表行数乘以列数。</p>
          <h5>减法</h5>
          <p>再次点击已经选中的格子，就会取消选择，这代表减去这些数字。</p>
          <br />
          <h5>提示</h5>
          <p>观察上方的算式，尝试算出答案，然后可以点击"重置"开始新的练习。</p>
          <br />
          <br />
          <button onClick={toggleShowHelp}>我知道了</button>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  // 初始化10x10网格，所有单元格初始为未选中
  const initialGrid: CellStatus[][] = Array(10)
    .fill(null)
    .map(() => Array(10).fill('unselected'));

  const [grid, setGrid] = useState<CellStatus[][]>(initialGrid);
  const [equation, setEquation] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showHelp, setShowHelp] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ row: number; col: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ row: number; col: number } | null>(null);
  const dragRef = useRef(false);

  // 新的状态切换函数：已选中点击后直接变为未选中，其他状态按原逻辑
  const toggleCellStatus = (status: CellStatus): CellStatus => {
    switch (status) {
      case 'selected':
        return 'excluded';
      case 'unselected':
        return 'selected';
      case 'excluded':
        return 'excluded';
      default:
        return status;
    }
  };

  // 处理拖拽开始
  const handleDragStart = (row: number, col: number) => {
    setIsDragging(true);
    setStartPos({ row, col });
    setCurrentPos({ row, col });
    dragRef.current = true;
  };

  // 处理拖拽过程
  const handleDragOver = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      setCurrentPos({ row, col });
      console.log(row, col);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    if (startPos && currentPos) {
      // 计算矩形范围
      const minRow = Math.min(startPos.row, currentPos.row);
      const maxRow = Math.max(startPos.row, currentPos.row);
      const minCol = Math.min(startPos.col, currentPos.col);
      const maxCol = Math.max(startPos.col, currentPos.col);

      console.log(minRow, maxRow, minCol, maxCol);

      // 更新矩形范围内的单元格为选中状态
      let excludeCount = 0;
      let includeCount = 0;
      const newGrid = grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol) {
            const newCell = toggleCellStatus(cell);
            if (cell == 'selected') {
              excludeCount += 1;
            } else if (cell == 'unselected') {
              includeCount += 1;
            }
            return newCell;
          }
          return cell;
        })
      );
      if (includeCount > 0 && excludeCount > 0) {
        setMessage('区块重合了，忽略本次操作。请重试');
        setTimeout(() => {
          setMessage('');
        }, TIMEOUT_DURATION);
        setIsDragging(false);
        setStartPos(null);
        setCurrentPos(null);
        return;
      }

      setGrid(newGrid);
        
      setEquation(prev => {
        const rowCount = Math.abs(maxRow-minRow)+1;
        const colCount = Math.abs(maxCol - minCol)+1;

        let area = '';
        if (rowCount == 1 && colCount > 1) {
          area = colCount.toString();
        } else if (rowCount > 1 && colCount == 1) {
          area = rowCount.toString();
        } else if (rowCount == 1 && colCount == 1) {
          area = '1';
        } else {
          area = `${rowCount} ✖️ ${colCount}`;
        }

        const sign = includeCount > 0 ? ' + ' : ' - ';

        if (prev == '') {
          return area;
        } else {
          return prev + sign + area;
        }
      });
    }

    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleReset = () => {
    setGrid(initialGrid);
    setEquation('');
  }

  const toggleShowHelp = () => {
    setShowHelp(!showHelp);
  }

  return (
    <div className={styles.App}>
      { showHelp && <Help toggleShowHelp={toggleShowHelp} />}
      <div className={styles.container}>
      <h1>小学生计算器</h1>
      <div className={styles.equation}>
        {equation}
      </div>
      { message != '' && <div className={styles.message}>
        {message}
      </div>}

      <div className={styles.operation}>
        <button onClick={() => handleReset()}>重置</button>
        <button onClick={() => toggleShowHelp()}>帮助</button>
      </div>

      <table className={styles.table}>
        {grid.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cellStatus, colIdx) => (
              <td
                key={colIdx}
                className={styles.cell}
                style={{
                  // 合并 backgroundColor 逻辑
                  backgroundColor: isDragging && startPos && currentPos
                    ? (rowIdx >= Math.min(startPos.row, currentPos.row) &&
                      rowIdx <= Math.max(startPos.row, currentPos.row) &&
                      colIdx >= Math.min(startPos.col, currentPos.col) &&
                      colIdx <= Math.max(startPos.col, currentPos.col))
                      ? 'rgba(0, 255, 0, 0.2)'
                      : (cellStatus === 'selected' ? '#c3e6cb' : cellStatus === 'excluded' ? '#f8d7da' : '#fff')
                    : (cellStatus === 'selected' ? '#c3e6cb' : cellStatus === 'excluded' ? '#f8d7da' : '#fff'),
                }}
                onMouseDown={() => handleDragStart(rowIdx, colIdx)}
                onMouseMove={(e) => handleDragOver(rowIdx, colIdx, e)}
                onMouseUp={handleDragEnd}
              >
                {cellStatus === 'selected' && '🍎'}
                {cellStatus === 'excluded' && '✗'}
              </td>
            ))}
          </tr>
        ))}
      </table>
      </div>
    </div>
  );
};

export default App;