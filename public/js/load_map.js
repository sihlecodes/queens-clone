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
    return new Promise((resolve, reject) => {
        let img = cv.imread(image);

        let min_dimension = Math.min(img.cols, img.rows);
        const MIN_IMAGE_DIMENSION = 800;

        if (min_dimension < MIN_IMAGE_DIMENSION) {
            const ratio = MIN_IMAGE_DIMENSION / min_dimension;

            cv.resize(img, img, new cv.Size(ratio * img.cols, ratio * img.rows));
        }
        cv.imshow('o1', img);

        // let kern = cv.matFromArray(3, 3, cv.CV_32F, [
        //     0, -1, 0,
        //     -1, 5, -1,
        //     0, -1, 0,
        // ]);
        //
        // cv.filter2D(img, img, cv.CV_8U, kern);
        // cv.filter2D(img, img, cv.CV_8U, kern);

        // cv.imshow('o2', img);

        let white = new cv.Scalar(255, 255, 255, 255);
        cv.copyMakeBorder(img, img, 10, 10, 10, 10, cv.BORDER_CONSTANT, white);

        let edges = new cv.Mat();
        cv.Canny(img, edges, 100, 200);
        // cv.GaussianBlur(img, img, new cv.Size(3, 3), 1);

        cv.imshow('o1', edges);

        let kernel;

        kernel = new cv.Mat.ones(2, 2, cv.CV_8U);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1)
        kernel.delete();

        cv.imshow('o1', edges);

        kernel = cv.Mat.ones(11, 11, cv.CV_8U);
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
        kernel.delete();

        cv.imshow('o1', edges);

        kernel = cv.Mat.ones(2, 2, cv.CV_8U);
        cv.erode(edges, edges, kernel, new cv.Point(-1, -1), 1)
        kernel.delete();

        cv.imshow('o1', edges);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

        let i = 0;
        let board_bounds = null;
        let board_contour_index = -1;
        let largest_area = 0;

        cv.imshow('o1', edges);
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

                let copy = img.clone();
                cv.drawContours(copy, contours, i, randcolor(), 3);
                cv.imshow('o2', copy);
                copy.delete();

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

        let copy = img.clone();
        cv.drawContours(copy, contours, board_contour_index, new cv.Scalar(155, 90, 240, 255), 2);
        cv.imshow('o2', copy);
        copy.delete();

        console.log('iterations:', its, 'contours:', contours.size());

        // works surpising well across different screenshot resolutions
        const BORDER_FACTOR = 0.0245;
        const BORDER_OFFSET_X = board_bounds.width * BORDER_FACTOR;
        const BORDER_OFFSET_Y = board_bounds.height * BORDER_FACTOR;

        board_bounds.x += BORDER_OFFSET_X / 2;
        board_bounds.y += BORDER_OFFSET_Y / 2;
        board_bounds.width -= BORDER_OFFSET_X;
        board_bounds.height -= BORDER_OFFSET_Y;

        let loops = 0;

        let next_child_index = hierarchy.intPtr(0, board_contour_index)[2];
        let board = img.roi(board_bounds);

        while (next_child_index !== -1) {
            let bounds = cv.boundingRect(contours.get(next_child_index));
            let area = bounds.width * bounds.height;

            if (area >= largest_area / 2) {
                next_child_index = hierarchy.intPtr(0, next_child_index)[2];
                continue;
            }

            // if (Math.abs(bounds.width - bounds.height) < 10)
            loops++;

            let copy = img.clone();
            
            cv.drawContours(copy, contours, next_child_index, new cv.Scalar(0, 120, 230, 255), -1);
            cv.imshow('o1', copy);

            next_child_index = hierarchy.intPtr(0, next_child_index)[0];
            copy.delete();
        }

        console.log('loops:', loops);

        let division_votes = {};

        for (let i = 0; i < contours.size(); ++i) {
            let { width, height } = cv.boundingRect(contours.get(i));
            let average = (width + height) / 2;
            let divisions = Math.floor(board_bounds.width / average);

            if (divisions > 2 && divisions < 12) {
                if (!(divisions in division_votes))
                    division_votes[divisions] = 0;

                division_votes[divisions]++;
            }
        }

        contours.delete();
        hierarchy.delete();

        const nominees = Object.keys(division_votes); 

        if (nominees.length === 0)
            return reject('board not found');

        let divions = nominees.reduce(
            (a, b) => division_votes[a] > division_votes[b] ? a : b) * 1;

        let tile_width = board_bounds.width / divions;
        let tile_height = board_bounds.height / divions;

        let color_hashes = [];
        let threshold = 20;
        let map = [];

        for (let i = 0; i < divions; i++)
            map.push([]);

        for (let y = 0; y < divions; y++) {
            label: for (let x = 0; x < divions; x++) {
                let pos_x = x * tile_width;
                let pos_y = y * tile_height;

                let region = new cv.Rect(pos_x, pos_y, tile_width, tile_height);
                let tile = board.roi(region);

                cv.cvtColor(tile, tile, cv.COLOR_RGB2HSV);
                let dominant_color_hsv = get_dominant_color(tile, { threshold: 10 });

                let pixel = new cv.Mat(1, 1, cv.CV_8UC3, [...dominant_color_hsv, 255]);
                cv.cvtColor(pixel, pixel, cv.COLOR_HSV2RGB);

                let dominant_color_rgb = pixel.data;
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


        if (color_hashes.length !== divions)
            return reject('dimension miss match');

        img.delete();
        edges.delete();

        let color_map = color_hashes.map(hash => `rgb(${from_hash(hash).join(',')})`);

        resolve({color_map, map});
    });
}
