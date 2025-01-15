function is_similar(color1, color2, threshold) {
    return color1.every((c1, i) => Math.abs(c1 - color2[i]) < threshold);
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

        cv.imshow('o1', edges);

        let kernel;

        kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1)
        kernel.delete();

        cv.imshow('o1', edges);

        kernel = cv.Mat.ones(9, 9, cv.CV_8U);
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
        kernel.delete();

        cv.imshow('o1', edges);

        // kernel = cv.Mat.ones(2, 2, cv.CV_8U);
        // cv.erode(edges, edges, kernel, new cv.Point(-1, -1), 1)
        // kernel.delete();

        // cv.imshow('o1', edges);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        edges.delete();

        let index = 0;
        let board_contour_index = -1;
        let largest_area = 0;

        let its = 0;
        let queue = [];

        const randint = (min, max) => Math.floor(min + (Math.random() * (max - min)));
        const randcolor = () => new cv.Scalar(randint(0, 100), randint(50, 255), randint(100, 255), 255);

        while (largest_area < 200 * 200) {
            let next  = hierarchy.intPtr(0, index)[0];
            let child = hierarchy.intPtr(0, index)[2];

            if (child >= 0) {
                queue.push(child);

                its++;

                let copy = img.clone();
                cv.drawContours(copy, contours, index, randcolor(), 3);
                cv.imshow('o1', copy);
                copy.delete();

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

            if (bounds.width > 20 && bounds.height > 20) {
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

        console.log('valid tiles:', loops);

        let divisions = Math.sqrt(loops);

        if (divisions !== Math.floor(divisions))
            return reject('dimension miss match');

        console.log('divisions:', divisions);

        let color_map = [];
        let threshold = 10;
        let map = [];

        for (let i = 0; i < divisions; i++)
            map.push([]);

        let new_contours = new cv.MatVector();

        for (let y = 0; y < divisions; y++) {
            let row = children.splice(children.length - divisions, divisions);
            row = row.sort((a, b) => a.bounds.x - b.bounds.x);

            color_found: for (let x = 0; x < divisions; x++) {
                let index = row[x].index;
                let bounds = row[x].bounds;
                let tile = img.roi(bounds);

                let transformation = cv.matFromArray(2, 3, cv.CV_64F,
                        [1, 0, -bounds.x,
                         0, 1, -bounds.y]);

                // let copy = img.clone();
                // cv.rectangle(copy, {x: bounds.x, y: bounds.y}, {x: bounds.x+bounds.width, y: bounds.y+bounds.height}, randcolor(), -1);
                // cv.imshow('o1', copy);
                // copy.delete();

                let contour = contours.get(index);

                cv.transform(contour, contour, transformation);
                new_contours.push_back(contour);

                let child_index = hierarchy.intPtr(0, index)[2];

                let mask = new cv.Mat.zeros(tile.rows, tile.cols, cv.CV_8UC1);
                cv.drawContours(mask, new_contours, new_contours.size() - 1, new cv.Scalar(255), -1);

                if (child_index !== -1) {
                    contour = contours.get(child_index);
                    new_contours.push_back(contour);

                    cv.transform(contour, contour, transformation);
                    cv.drawContours(mask, new_contours, new_contours.size() - 1, new cv.Scalar(0), -1);
                }

                // await new Promise((resolve, _) => setTimeout(resolve, 100));
                // cv.imshow('o1', tile);
                // cv.imshow('o2', mask);
                // await new Promise((resolve, _) => setTimeout(resolve, 300));

                let kernel = cv.Mat.ones(4, 4, cv.CV_8U);
                cv.erode(mask, mask, kernel, new cv.Point(-1, -1), 1)
                kernel.delete();

                // cv.imshow('o2', mask);
                
                let composite = new cv.Mat();
                cv.bitwise_and(tile, tile, composite, mask);

                // cv.imshow('o3', composite);
                // await new Promise((resolve, _) => setTimeout(resolve, 300));

                let tile_color = cv.mean(composite, mask).map(Math.round);

                composite.delete();
                mask.delete();

                for (let i = 0; i < color_map.length; i++) {
                    const color = color_map[i];

                    if (is_similar(color, tile_color, threshold)) {
                        map[y][x] = i;
                        continue color_found;
                    }
                }

                color_map.push(tile_color);
                map[y][x] = color_map.length - 1;
            }
        }

        contours.delete();
        hierarchy.delete();

        console.log('colors:', color_map);

        if (color_map.length !== divisions)
            return reject('dimension miss match');

        img.delete();

        color_map = color_map.map(color => `rgb(${color.join(',')})`);

        resolve({color_map, map});
    });
}
