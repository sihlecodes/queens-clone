const IDEAL_IMAGE_RESOLUTION = 1000;

const COLOR_SIMILARITY_THRESHOLD = 5;
const TILE_PADDING_RATIO = 0.05;

const MIN_BOARD_DIMENSION = 200;
const MIN_BOARD_AREA = MIN_BOARD_DIMENSION * MIN_BOARD_DIMENSION;

export function load_map_from_image(image_element) {
    return new Promise((resolve, reject) => {
        let image = cv.imread(image_element);

        const white = new cv.Scalar(255, 255, 255, 255);
        const ratio = IDEAL_IMAGE_RESOLUTION / Math.min(image.cols, image.rows);

        cv.resize(image, image, new cv.Size(ratio * image.cols, ratio * image.rows));
        cv.copyMakeBorder(image, image, 10, 10, 10, 10, cv.BORDER_CONSTANT, white);

        let edges = new cv.Mat();
        cv.Canny(image, edges, 100, 200);

        let kernel;

        kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1)
        kernel.delete();

        kernel = cv.Mat.ones(9, 9, cv.CV_8U);
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
        kernel.delete();

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        edges.delete();

        let board_index = get_board_contour_index(contours, hierarchy);
        let children_data = get_children_contour_data(board_index, contours, hierarchy);

        let valid_tile_count = children_data.length;
        let divisions = Math.sqrt(valid_tile_count);

        if (divisions === 0 || divisions !== Math.floor(divisions))
            return reject('Error while parsing the board');

        console.log('Board has divisions:', divisions);

        let map_data = get_map_data(divisions, children_data, image, contours, hierarchy);

        contours.delete();
        hierarchy.delete();
        image.delete();

        if (map_data.color_map.length !== divisions)
            return reject('Colors don\'t match width board dimensions');

        resolve(map_data);
    });
}

function is_similar(color1, color2, threshold) {
    return color1.every((c1, i) => Math.abs(c1 - color2[i]) < threshold);
}

function get_similar_color_index(color, color_map, threshold) {
    for (let i = 0; i < color_map.length; i++) {
        const existing_color = color_map[i];

        if (is_similar(existing_color, color, threshold))
            return i;
    }

    return -1;
}

function get_board_contour_index(contours, hierarchy) {
    let index = 0;
    let board_contour_index = -1;
    let largest_area = 0;
    let queue = [];

    let iterations = 0;

    while (largest_area < MIN_BOARD_AREA) {

        let next  = hierarchy.intPtr(0, index)[0];
        let child = hierarchy.intPtr(0, index)[2];

        if (child >= 0) {
            queue.push(child);

            iterations++;

            let contour = contours.get(index);
            let bounds = cv.boundingRect(contour);

            // is roughly a square
            if (Math.abs(bounds.width - bounds.height) <= 5) {
                let area = bounds.width * bounds.height;

                if (area > largest_area) {
                    board_contour_index = index;
                    largest_area = area;
                }
            }
        }

        if (next >= 0)
            index = next;

        else if (queue.length > 0)
            index = queue.shift();

        else break;
    }

    console.log('Found board in iterations:', iterations, 'out of contours:', contours.size());
    return board_contour_index;
}

function get_children_contour_data(board_contour_index, contours, hierarchy) {
    let children_contour_data = [];
    let child_index = hierarchy.intPtr(0, board_contour_index)[2];

    while (child_index !== -1) {
        let bounds = cv.boundingRect(contours.get(child_index));

        if (bounds.width > 20 && bounds.height > 20)
            children_contour_data.push({index: child_index, bounds});

        child_index = hierarchy.intPtr(0, child_index)[0];
    }

    return children_contour_data;
}

function get_map_data(divisions, children_data, image, contours, hierarchy) {
    let color_map = [];
    let map = [];

    const white = new cv.Scalar(255);
    const black = new cv.Scalar(0);

    for (let i = 0; i < divisions; i++)
        map.push([]);

    let translated_contours = new cv.MatVector();

    for (let y = 0; y < divisions; y++) {
        let row = children_data.splice(children_data.length - divisions, divisions);
        row = row.sort((a, b) => a.bounds.x - b.bounds.x);

        for (let x = 0; x < divisions; x++) {
            let item = row[x];
            let tile = image.roi(item.bounds);

            let child_index = hierarchy.intPtr(0, item.index)[2];

            let mask = new cv.Mat.zeros(tile.rows, tile.cols, cv.CV_8UC1);
            let padding = tile.cols * TILE_PADDING_RATIO;

            cv.rectangle(mask,
                {x: padding, y: padding},
                {x: tile.cols - padding, y: tile.rows - padding}, white, -1);

            if (child_index !== -1) {
                let transformation = cv.matFromArray(2, 3, cv.CV_32F,
                    [1, 0, -item.bounds.x,
                     0, 1, -item.bounds.y]);

                let contour = contours.get(child_index);
                translated_contours.push_back(contour);
                cv.transform(contour, contour, transformation);

                let index = translated_contours.size() - 1;
                cv.drawContours(mask, translated_contours, index, black, -1);

                transformation.delete();
            }

            let composite = new cv.Mat();
            cv.bitwise_and(tile, tile, composite, mask);

            let averaged_color = cv.mean(composite, mask).map(Math.round);

            tile.delete();
            mask.delete();
            composite.delete();

            let index = get_similar_color_index(averaged_color, color_map,
                COLOR_SIMILARITY_THRESHOLD);

            if (index === -1) {
                color_map.push(averaged_color);
                index = color_map.length - 1;
            }

            map[y][x] = index;
        }
    }

    translated_contours.delete();
    color_map = color_map.map(color => `rgb(${color.join(',')})`);

    return { color_map, map }
}
