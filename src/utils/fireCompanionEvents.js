export async function triggerCompanionButton(pageIndex, row, col, companionAddress) {
  try {
    const url = `http://${companionAddress}/api/location/${pageIndex + 1}/${col}/${row}/press`;
    await fetch(url, { method: 'POST' });

  } catch (error) {
    console.error('Trigger failed:', error);
  }
}