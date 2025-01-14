function is_similar(color1, color2, threshold = 2) {
    return color1.every((c1, i) => Math.abs(c1 - color2[i]) < threshold);
}

function to_hash(color) {
    return color.reduce((a, b, i) => a | (b << (i << 3)));
}

function from_hash(hash, comps=3) {
    let components = [];

    while (comps-- > 0) {
        components.push(hash & 0xFF);
        hash >>= 8;
    }

    return components;
}

function get_dominant_color(mat, { threshold, samples_x = 8, samples_y = 8 }) {
    const PADDING_RATIO = 0.1;

    let padding_x = mat.cols * PADDING_RATIO;
    let padding_y = mat.rows * PADDING_RATIO;

    let spread_x = (mat.cols - 2 * padding_x) / samples_x;
    let spread_y = (mat.rows - 2 * padding_y) / samples_y;

    let color_votes = {};

    for (let y = 0; y <= samples_y; y++) {
        label: for (let x = 0; x <= samples_x; x++) {
            let pos = {
                x: padding_x + (x * spread_x),
                y: padding_y + (y * spread_y),
            }

            let hsv = mat.ucharPtr(pos.x, pos.y);

            for (const hash in color_votes) {
                if (is_similar(from_hash(hash), hsv, threshold)) {
                    color_votes[hash] += 1;
                    continue label;
                }
            }

            color_votes[to_hash(hsv)] = 0;
        }
    }

    const dominant_color_hash = Object.keys(color_votes).reduce(
        (a, b) => color_votes[a] > color_votes[b] ? a : b);

    return from_hash(dominant_color_hash);
}

export function load_map_from_image(image) {
    return new Promise(async (resolve, reject) => {
        let img = cv.imread(image);

        let min_dimension = Math.min(img.cols, img.rows);
        const IDEAL_IMAGE_RESOLUTION = 1000;
        const ratio = IDEAL_IMAGE_RESOLUTION / min_dimension;

        cv.resize(img, img, new cv.Size(ratio * img.cols, ratio * img.rows));
        // cv.imshow('o1', img);

        let white = new cv.Scalar(255, 255, 255, 255);
        cv.copyMakeBorder(img, img, 10, 10, 10, 10, cv.BORDER_CONSTANT, white);

        let edges = new cv.Mat();
        cv.Canny(img, edges, 100, 200);
        // cv.GaussianBlur(img, img, new cv.Size(3, 3), 1);

        // cv.imshow('o1', edges);

        let kernel;

        kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1)
        kernel.delete();

        // cv.imshow('o1', edges);

        kernel = cv.Mat.ones(11, 11, cv.CV_8U);
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
        kernel.delete();

        // cv.imshow('o1', edges);

        // kernel = cv.Mat.ones(2, 2, cv.CV_8U);
        // cv.erode(edges, edges, kernel, new cv.Point(-1, -1), 1)
        // kernel.delete();

        // cv.imshow('o1', edges);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        edges.delete();

        let i = 0;
        let board_bounds = null;
        let board_contour_index = -1;
        let largest_area = 0;

        // cv.imshow('o1', edges);
        let its = 0;
        let queue = [];

        const randint = (min, max) => Math.floor(min + (Math.random() * (max - min)));
        const randcolor = () => new cv.Scalar(randint(0, 100), randint(50, 255), randint(100, 255), 255);

        while (!board_bounds || board_bounds.width < 200) {
            let next  = hierarchy.intPtr(0, i)[0];
            let child = hierarchy.intPtr(0, i)[2];

            if (child >= 0) {
                queue.push(child);

                its++;

                // let copy = img.clone();
                // cv.drawContours(copy, contours, i, randcolor(), 3);
                // cv.imshow('o1', copy);
                // copy.delete();

                let contour = contours.get(i);
                let bounds = cv.boundingRect(contour);

                // is roughly a square
                if (Math.abs(bounds.width - bounds.height) <= 5) {
                    let area = bounds.width * bounds.height;

                    if (area > largest_area) {
                        board_contour_index = i;
                        board_bounds = bounds;
                        largest_area = area;
                    }
                }
            }

            if (next >= 0)
                i = next;
            
            else if (queue.length > 0)
                i = queue.shift();

            else {
                reject('board not found');
                break;
            }
        }

        // let copy = img.clone();
        // cv.drawContours(copy, contours, board_contour_index, new cv.Scalar(155, 90, 240, 255), 2);
        // cv.imshow('o1', copy);
        // copy.delete();

        console.log('iterations:', its, 'contours:', contours.size());

        let loops = 0;
        let child_index = hierarchy.intPtr(0, board_contour_index)[2];

        let children = [];

        while (child_index !== -1) {
            let bounds = cv.boundingRect(contours.get(child_index));

            if (bounds.width > 50) {
                children.push({index: child_index, bounds});
                loops++;
            }

            // copy = img.clone();
            // cv.drawContours(copy, contours, child_index, new cv.Scalar(0, 120, 230, 255), 20);
            // cv.imshow('o1', copy);
            // copy.delete();

            // await new Promise((resolve, _) => setTimeout(resolve, 100));

            child_index = hierarchy.intPtr(0, child_index)[0];
        }

        console.log('loops:', loops);

        let divisions = Math.sqrt(loops);

        if (divisions !== Math.floor(divisions))
            return reject('dimension miss match');

        console.log('divisions:', divisions);

        let color_hashes = [];
        let threshold = 10;
        let map = [];

        for (let i = 0; i < divisions; i++)
            map.push([]);

        for (let y = 0; y < divisions; y++) {
            let row = children.splice(children.length - divisions, divisions);
            row = row.sort((a, b) => a.bounds.x - b.bounds.x);

            label: for (let x = 0; x < divisions; x++) {
                let region = row[x].bounds;
                let copy = img.clone();
                cv.rectangle(copy, {x: region.x, y: region.y}, {x: region.x+region.width, y: region.y+region.height}, randcolor(), -1);
                // cv.imshow('o1', copy);
                copy.delete();

                // await new Promise((resolve, _) => setTimeout(resolve, 100));
                let index = row[x].index;
                let child = hierarchy.intPtr(0, index)[2];
                let tile = img.roi(region);
                cv.imshow('o2', tile);

                let mask = new cv.Mat(img.rows, img.cols, cv.CV_8UC1, new cv.Scalar(255));

                if (child !== -1)
                    cv.drawContours(mask, contours, child, new cv.Scalar(0), -1);

                let cmask = mask.roi(region);
                cv.imshow('o1', cmask);

                let dominant_color_rgb = cv.mean(tile, cmask);

                cmask.delete();
                mask.delete();

                let dominant_color_as_hash = to_hash(dominant_color_rgb);

                for (let i = 0; i < color_hashes.length; i++) {
                    const hash = color_hashes[i];

                    if (is_similar(from_hash(hash), dominant_color_rgb, threshold)) {
                        map[y][x] = i;
                        continue label;
                    }
                }

                color_hashes.push(dominant_color_as_hash);
                map[y][x] = color_hashes.length - 1;
            }
        }

        contours.delete();
        hierarchy.delete();

        if (color_hashes.length !== divisions)
            return reject('dimension miss match');

        img.delete();

        let color_map = color_hashes.map(hash => `rgb(${from_hash(hash).join(',')})`);

        resolve({color_map, map});
    });
}
