class AddLevelButtonRenderer {
    constructor(data) {
        this._data = data;
    }

    draw(target) {
        if (!this._data.visible || !this._data.priceScaleWidth) return;

        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const h = scope.horizontalPixelRatio;
            const v = scope.verticalPixelRatio;

            const { y, priceScaleWidth, buttonWidth, priceText } = this._data;
            if (!priceText) return;

            const buttonHeight = 24 * v;
            const buttonW = buttonWidth * h;
            const buttonX = ((priceScaleWidth - buttonWidth) / 2) * h;
            const buttonY = y * v - buttonHeight / 2;
            const radius = 4 * v;

            ctx.save();

            ctx.fillStyle = '#7b61ff';
            this._drawRoundedRect(ctx, buttonX, buttonY, buttonW, buttonHeight, radius);
            ctx.fill();

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2 * v;
            const iconSize = 12 * v;
            const iconX = buttonX + 6 * h;
            const iconY = buttonY + (buttonHeight - iconSize) / 2;
            const centerX = iconX + iconSize / 2;
            const centerY = iconY + iconSize / 2;
            const plusPadding = 2 * v;

            ctx.beginPath();
            ctx.moveTo(iconX + plusPadding, centerY);
            ctx.lineTo(iconX + iconSize - plusPadding, centerY);
            ctx.moveTo(centerX, iconY + plusPadding);
            ctx.lineTo(centerX, iconY + iconSize - plusPadding);
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = `${11 * v}px sans-serif`;
            ctx.textBaseline = 'middle';
            const textX = iconX + iconSize + 4 * h;
            ctx.fillText(priceText, textX, buttonY + buttonHeight / 2);

            ctx.restore();
        });
    }

    _drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class AddLevelButtonPaneView {
    constructor(data) {
        this._data = data;
    }
    renderer() {
        return new AddLevelButtonRenderer(this._data);
    }
    zOrder() {
        return 'top';
    }
}

class AddLevelButtonPlugin {
    constructor(onClick) {
        this._onClick = onClick;
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
        this._y = null;
        this._price = null;
        this._buttonWidth = 100;
        this._priceText = '';
        this._visible = false;
        this._paneViews = [new AddLevelButtonPaneView(this)];
        this._container = null;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }

    get visible() { return this._visible; }
    get y() { return this._y; }
    get buttonWidth() { return this._buttonWidth; }
    get priceText() { return this._priceText; }

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
        this._container.addEventListener('mousemove', this._onMouseMove);
        this._container.addEventListener('mousedown', this._onMouseDown);
        this._container.addEventListener('mouseleave', this._onMouseLeave);
    }

    detached() {
        this._container.removeEventListener('mousemove', this._onMouseMove);
        this._container.removeEventListener('mousedown', this._onMouseDown);
        this._container.removeEventListener('mouseleave', this._onMouseLeave);
    }

    priceAxisPaneViews() {
        return this._paneViews;
    }

    updateAllViews() {}

    _updateMetrics() {
        if (this._price === null || this._price === undefined) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '11px sans-serif';
        const text = this._price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const textWidth = ctx.measureText(text).width;
        const padding = 6;
        const iconWidth = 12;
        const gap = 4;
        this._buttonWidth = Math.max(80, padding + iconWidth + gap + textWidth + padding);
        this._priceText = text;
    }

    _onMouseMove(e) {
        const rect = this._container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const chartWidth = rect.width;
        const wasVisible = this._visible;

        if (x > chartWidth - 50) {
            this._visible = true;
            this._y = y;
            const price = this._series.coordinateToPrice(y);
            if (price !== null && price !== undefined) {
                this._price = price;
                this._updateMetrics();
            }
        } else {
            this._visible = false;
        }

        if (wasVisible !== this._visible || this._visible) {
            this._requestUpdate();
        }
    }

    _onMouseDown(e) {
        if (!this._visible) return;

        const rect = this._container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const chartWidth = rect.width;
        const priceScaleWidth = this.priceScaleWidth;

        if (x < chartWidth - priceScaleWidth) return;

        const buttonWidth = this._buttonWidth || 100;
        const buttonHeight = 24;
        const buttonX = chartWidth - priceScaleWidth + (priceScaleWidth - buttonWidth) / 2;
        const buttonY = this._y - buttonHeight / 2;

        if (
            x >= buttonX &&
            x <= buttonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
        ) {
            const price = this._series.coordinateToPrice(this._y);
            if (price !== null && price !== undefined) {
                this._onClick(price);
            }
        }
    }

    _onMouseLeave() {
        if (this._visible) {
            this._visible = false;
            this._requestUpdate();
        }
    }
}

export { AddLevelButtonPlugin };