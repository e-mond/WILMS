export function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const matrix: number[][] = Array.from({ length: left.length + 1 }, (_, rowIndex) =>
    Array.from({ length: right.length + 1 }, (_, columnIndex) => {
      if (rowIndex === 0) {
        return columnIndex;
      }

      if (columnIndex === 0) {
        return rowIndex;
      }

      return 0;
    }),
  );

  for (let rowIndex = 1; rowIndex <= left.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= right.length; columnIndex += 1) {
      const substitutionCost = left[rowIndex - 1] === right[columnIndex - 1] ? 0 : 1;

      matrix[rowIndex]![columnIndex] = Math.min(
        matrix[rowIndex - 1]![columnIndex]! + 1,
        matrix[rowIndex]![columnIndex - 1]! + 1,
        matrix[rowIndex - 1]![columnIndex - 1]! + substitutionCost,
      );
    }
  }

  return matrix[left.length]![right.length]!;
}
