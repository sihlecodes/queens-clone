export class SVGToCanvasContext {
    constructor(svg) {
        this.svg = svg;
        this.clear();
    }

    clear() {
        this.path = [];

        this.strokeStyle = 'black';
        this.fillStyle = 'none';
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

    *extract_all(x, y, width, height, tolerance=1) {
        // extract an area that is slightly larger because
        // the bounds of `getBBox()` are sometimes off by a bit.
        x -= tolerance / 2;
        y -= tolerance / 2;
        width += tolerance;
        height += tolerance;

        const children = Array.from(this.get_children());

        for (const child of children) {
            const bounds = child.getBBox();

            if (bounds.x >= x &&
                bounds.x + bounds.width <= x + width &&
                bounds.y >= y &&
                bounds.y + bounds.height <= y + height)
                    yield child;
        }
    }

    extract(x, y, width, height, tolerance=1) {
        const generator = this.extract_all(x, y, width, height, tolerance);
        return generator.next().value;
    }

    add_line(start_x, start_y, end_x, end_y) {
        this.moveTo(start_x, start_y);
        this.lineTo(end_x, end_y);
    }

    clearRect(x, y, width, height) {
        const generator = this.extract_all(x, y, width, height);

        let item = generator.next();

        while (!item.done) {
            this.remove_child(item.value);
            item = generator.next();
        }
    }

    style(element, excluded = []) {
        const fields = new Map([
            ['stroke-width', 'lineWidth'],
            ['filter', 'filter'],
            ['stroke', 'strokeStyle'],
            ['fill', 'fillStyle'],
        ]);

        if (this.filter === 'none')
            excluded.push('filter');

        if (this.lineWidth <= 0)
            excluded.push('lineWidth');

        for (const [svg_field, ctx_field] of fields) {
            if (!excluded.includes(svg_field) && !excluded.includes(ctx_field))
                element.setAttribute(svg_field, this[ctx_field]);
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

        this.style(rect, ['strokeStyle', 'lineWidth']);

        return this.append_child(rect);
    }

    drawImageFromSource(href, x, y, width, height) {
        const image = this.create_element('image');;

        image.setAttribute('href', href);
        image.setAttribute('x', x);
        image.setAttribute('y', y);

        this.style(image, ['fillStyle', 'strokeStyle', 'lineWidth']);

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

        path.setAttribute('d', this.path.join(' '));
        this.style(path);
        this.path = [];

        return this.append_child(path);
    }
}

export class LayeredSVGToCanvasContext extends SVGToCanvasContext {
    constructor(svg, name = 'root', layers={}, root = null) {
        super(svg);
        this.name = name;
        this.layers = layers;
        this.root = root ?? this;
    }

    clear() {
        super.clear();

        if (!this.root || this.root === this)
            return;

        while (this.svg.firstChild)
            this.svg.removeChild(this.svg.firstChild);
    }

    layer(name) {
        if (!(name in this.layers)) {
            let group = document.querySelector(`svg g#${name}`);

            if (group === null) {
                group = this.create_element('g');
                group.setAttribute('id', name);
                this.append_child(group);
            }

            this.layers[name] = new LayeredSVGToCanvasContext(group, name, this.layers, this.root);
        }

        return this.layers[name];
    }
}
