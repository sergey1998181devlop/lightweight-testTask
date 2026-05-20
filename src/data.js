export function generateCandlestickData(count = 150) {
    const data = [];
    let lastClose = 50000;
    let lastTime = new Date('2024-01-01T00:00:00Z');

    for (let i = 0; i < count; i++) {
        const time = lastTime.getTime() / 1000;
        const volatility = 0.02;
        const change = lastClose * volatility * (Math.random() - 0.5);
        const open = lastClose;
        const close = open + change;
        const high = Math.max(open, close) + Math.abs(change) * Math.random() * 0.5;
        const low = Math.min(open, close) - Math.abs(change) * Math.random() * 0.5;

        data.push({
            time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(Math.max(0, low).toFixed(2)),
            close: parseFloat(close.toFixed(2)),
        });

        lastClose = close;
        lastTime.setUTCDate(lastTime.getUTCDate() + 1);
    }
    return data;
}