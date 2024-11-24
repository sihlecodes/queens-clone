export class SVGToCanvasContext {
    constructor(svg) {
        this.svg = svg;
        this.path = [];

        this.strokeStyle = 'black';
        this.fillStyle = 'black';
        this.filter = 'none';
        this.lineWidth = 0;
    }

    create_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    append_child(child) {
        this.svg.appendChild(child);
        return child;
    }

    remove_child(child) {
        this.svg.removeChild(child);
        return child;
    }

    get_children() {
        return this.svg.children;
    }

    rect(x, y, width, height) {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.closePath();
    }

    clearRect(x, y, width, height) {
        for (const child of this.get_children()) {
            const bounds = child.getBBox();

            // bounds occasionally come with rounding errors
            // Math.trunc removes these errors
            if (Math.trunc(bounds.x) >= x &&
                Math.trunc(bounds.x + bounds.width) <= (x + width) &&
                Math.trunc(bounds.y) >= y &&
                Math.trunc(bounds.y + bounds.height) <= (y + height)) {
                    return this.remove_child(child);
                }
        }
    }

    closePath() {
        this.path.push('Z');
    }

    fillRect(x, y, width, height) {
        const rect = this.create_element('rect');

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', this.fillStyle);
        rect.setAttribute('filter', this.filter);
        rect.setAttribute('stroke-width', 0);

        return this.append_child(rect);
    }

    drawImageFromSource(href, x, y, width, height) {
        const image = this.create_element('image');;

        image.setAttribute('href', href);
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('filter', this.filter);
        image.setAttribute('width', width);
        image.setAttribute('height', height);

        return this.append_child(image);
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
        const path = this.create_element('path');

        path.setAttribute('d', this.path.join(','));
        path.setAttribute('stroke', this.strokeStyle);
        path.setAttribute('fill', this.fillStyle);
        path.setAttribute('filter', this.filter);
        path.setAttribute('stroke-width', this.lineWidth);

        return this.append_child(path);
    }
}

export class LayeredSVGToCanvasContext extends SVGToCanvasContext {
    constructor(svg, name = 'root', layers={}) {
        super(svg);
        this.name = name;
        this.layers = layers;
    }

    layer(name) {
        if (!(name in this.layers)) {
            const group = this.create_element('g');
            group.setAttribute('id', name);

            this.append_child(group);
            this.layers[name] = new LayeredSVGToCanvasContext(group, name, this.layers);
        }

        return this.layers[name];
    }
}