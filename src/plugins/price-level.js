class PriceLevelPaneView {
    constructor(data) {
        this._data = data;
    }
    renderer() {
        return new PriceLevelRenderer(this._data);
    }
    zOrder() {
        return 'top';
    }
}

class PriceLevelAxisView {
    constructor(data) {
        this._data = data;
    }
    renderer() {
        return new PriceLevelAxisRenderer(this._data);
    }
    zOrder() {
        return 'top';
    }
}

class PriceLevelRenderer {
    constructor(data) {
        this._data = data;
    }

    draw(target) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const h = scope.horizontalPixelRatio;
            const v = scope.verticalPixelRatio;

            const { y, chartWidth, isHovered, isDragging } = this._data;
            if (y === null || y === undefined) return;

            const sY = y * v;
            const sW = chartWidth * h;

            ctx.save();

            if (isHovered || isDragging) {
                ctx.fillStyle = 'rgba(123, 97, 255, 0.2)';
                ctx.fillRect(0, sY - 8 * v, sW, 16 * v);

                const xSize = 16 * v;
                const xPos = sW - 25 * h;
                const centerX = xPos + xSize / 2;
                const centerY = sY;

                ctx.fillStyle = '#ef5350';
                ctx.beginPath();
                ctx.arc(centerX, centerY, xSize / 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5 * v;
                const offset = 4 * v;
                ctx.beginPath();
                ctx.moveTo(centerX - offset, centerY - offset);
                ctx.lineTo(centerX + offset, centerY + offset);
                ctx.moveTo(centerX + offset, centerY - offset);
                ctx.lineTo(centerX - offset, centerY + offset);
                ctx.stroke();
            }

            ctx.strokeStyle = '#7b61ff';
            ctx.lineWidth = 1 * v;
            ctx.beginPath();
            ctx.moveTo(0, sY);
            ctx.lineTo(sW, sY);
            ctx.stroke();

            ctx.restore();
        });
    }
}

class PriceLevelAxisRenderer {
    constructor(data) {
        this._data = data;
    }

    draw(target) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const h = scope.horizontalPixelRatio;
            const v = scope.verticalPixelRatio;

            const { y, price, priceScaleWidth } = this._data;

            if (y === null || y === undefined || price === null || price === undefined || !priceScaleWidth) {
                return;
            }

            const sY = y * v;
            const text = typeof price === 'number' ? price.toFixed(2) : String(price);

            ctx.save();

            ctx.font = `${11 * v}px sans-serif`;
            const padding = 4 * v;
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = 18 * v;
            const boxX = 0;
            const boxY = sY - boxHeight / 2;

            ctx.fillStyle = '#7b61ff';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

            ctx.fillStyle = 'white';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, boxX + padding, sY);

            ctx.restore();
        });
    }
}

class PriceLevelPlugin {
    constructor(id, price, onRemove) {
        this._id = id;
        this._price = typeof price === 'number' ? price : 0;
        this._onRemove = onRemove;
        this._y = null;
        this._isHovered = false;
        this._isDragging = false;
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
        this._container = null;
        this._paneViews = [new PriceLevelPaneView(this)];
        this._axisViews = [new PriceLevelAxisView(this)];

        this._onMove = this._onMove.bind(this);
        this._onDown = this._onDown.bind(this);
        this._onDrag = this._onDrag.bind(this);
        this._onUp = this._onUp.bind(this);
    }

    get y() { return this._y; }
    get isHovered() { return this._isHovered; }
    get isDragging() { return this._isDragging; }
    get price() { return this._price; }

    get chartWidth() {
        if (!this._container || !this._series) return 0;
        return this._container.clientWidth - this._series.priceScale().width();
    }

    get priceScaleWidth() {
        if (!this._series) return 0;
        try {
            return this._series.priceScale().width();
        } catch (e) {
            return 0;
        }
    }

    attached({ chart, series, requestUpdate }) {
        this._chart = chart;
        this._series = series;
        this._requestUpdate = requestUpdate;
        this._container = chart.chartElement();
        this._updateY();
        this._container.addEventListener('mousemove', this._onMove);
        this._container.addEventListener('mousedown', this._onDown);
        window.addEventListener('mousemove', this._onDrag);
        window.addEventListener('mouseup', this._onUp);
        this._requestUpdate();
    }

    detached() {
        this._container.removeEventListener('mousemove', this._onMove);
        this._container.removeEventListener('mousedown', this._onDown);
        window.removeEventListener('mousemove', this._onDrag);
        window.removeEventListener('mouseup', this._onUp);
    }

    paneViews() {
        return this._paneViews;
    }

    priceAxisPaneViews() {
        return this._axisViews;
    }

    _updateY() {
        if (this._series) {
            this._y = this._series.priceToCoordinate(this._price);
        }
    }

    updateAllViews() {
        this._updateY();
    }

    _onMove(e) {
        const rect = this._container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const wasHovered = this._isHovered;
        this._isHovered = x < this.chartWidth && Math.abs(y - this._y) < 8;
        if (wasHovered !== this._isHovered) {
            this._requestUpdate();
        }
    }

    _onDown(e) {
        if (!this._isHovered) return;

        const rect = this._container.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > this.chartWidth - 35) {
            this._onRemove(this._id);
            return;
        }

        this._isDragging = true;
    }

    _onDrag(e) {
        if (!this._isDragging) return;

        const rect = this._container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const newPrice = this._series.coordinateToPrice(y);

        if (newPrice !== null && newPrice !== undefined) {
            this._price = newPrice;
            this._updateY();
            this._requestUpdate();
        }
    }

    _onUp() {
        this._isDragging = false;
    }
}

export { PriceLevelPlugin };