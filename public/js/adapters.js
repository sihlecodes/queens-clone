export class SVGToCanvasContext {
    constructor(svg) {
        this.svg = svg;
        this.strokeStyle = 'black';
        this.lineWidth = 0;
        this.fillStyle = 'none';
        this.path = [];
    }

    rect(x, y, width, height) {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.closePath();
    }

    clearRect(x, y, width, height) {
        for (const child of this.svg.children) {
            const bounds = child.getBBox();

            if (bounds.x >= x &&
                (bounds.x + bounds.width) <= (x + width) &&
                bounds.y >= y &&
                (bounds.y + bounds.height) <= (y + height)) {
                    this.svg.removeChild(child);
                }
        }
    }

    closePath() {
        this.path.push('Z');
    }

    fillRect(x, y, width, height) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        
        rect.setAttribute('fill', this.fillStyle);
        rect.setAttribute('stroke-width', 0);

        this.svg.appendChild(rect);
    }

    drawImageFromSource(href, x, y, width, height) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', href);
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('width', width);
        image.setAttribute('height', height);

        this.svg.appendChild(image);
    }

    beginPath() {
        this.path = [];
    }

    moveTo(x, y) {
        this.path.push(`M${x} ${y}`);
    }

    lineTo(x, y) {
        this.path.push(`L${x} ${y}`);
    }

    stroke() {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', this.path.join(','));
        path.setAttribute('stroke', this.strokeStyle);
        path.setAttribute('fill', this.fillStyle);
        path.setAttribute('stroke-width', this.lineWidth);

        this.svg.appendChild(path);
    }
}