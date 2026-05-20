import { createChart, CandlestickSeries } from 'lightweight-charts';
import { generateCandlestickData } from './data.js';
import { AddLevelButtonPlugin } from './plugins/add-level-button.js';
import { PriceLevelPlugin } from './plugins/price-level.js';

const chartOptions = {
    width: window.innerWidth,
    height: window.innerHeight,
    layout: {
        textColor: '#d1d4dc',
        background: { type: 'solid', color: '#131722' },
    },
    grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
    },
    rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        visible: true,
    },
    timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        visible: true,
    },
};

const container = document.getElementById('chart-container');
const chart = createChart(container, chartOptions);

const candlestickSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
});

const data = generateCandlestickData(150);
candlestickSeries.setData(data);

let priceLevels = [];
let nextId = 0;

const onAddPriceLevel = (price) => {
    const id = nextId++;
    const plugin = new PriceLevelPlugin(id, price, (idToRemove) => {
        const index = priceLevels.findIndex(p => p.id === idToRemove);
        if (index !== -1) {
            candlestickSeries.detachPrimitive(priceLevels[index].plugin);
            priceLevels.splice(index, 1);
        }
    });
    priceLevels.push({ id, plugin });
    candlestickSeries.attachPrimitive(plugin);
};

const addButtonPlugin = new AddLevelButtonPlugin(onAddPriceLevel);
candlestickSeries.attachPrimitive(addButtonPlugin);

window.addEventListener('resize', () => {
    chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
    });
});