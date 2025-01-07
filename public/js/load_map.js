function is_similar(color1, color2, threshold = 2) {
    const comp1 = Math.abs(color1[0] - color2[0]);
    const comp2 = Math.abs(color1[1] - color2[1]);
    const comp3 = Math.abs(color1[2] - color2[2]);

    return comp1 < threshold && comp2 < threshold && comp3 < threshold;
}

const to_hash =  (color) => color.join(',');
const from_hash = (hash) => hash.split(',').map(x => x * 1);

function get_dominant_color(cv, mat, roi, { threshold = 3, samples_x = 8, samples_y = 8 }) {
    let spread_x = Math.floor(roi.width / samples_x);
    let spread_y = Math.floor(roi.height / samples_y);

    mat = mat.roi(roi);
    cv.cvtColor(mat, mat, cv.COLOR_RGB2HSV);

    let color_votes = {}

    for (let y = 0; y < samples_y; y++) {
        label: for (let x = 0; x < samples_x; x++) {
            let pos = {
                x: ((x + 1) * spread_x) - 1,
                y: ((y + 1) * spread_y) - 1,
            }

            let hsv = mat.ucharPtr(pos.y, pos.x);

            for (const c in color_votes) {
                if (is_similar(from_hash(c), hsv, threshold)) {
                    color_votes[c] += 1;
                    continue label;
                }
            }

            color_votes[to_hash(hsv)] = 0;
        }
    }
    const dominant_color_hsv = from_hash(Object.keys(color_votes).reduce(
        (a, b) => color_votes[a] > color_votes[b] ? a : b));

    let color = new cv.Mat(1, 1, cv.CV_8UC3);

    color.setTo([...dominant_color_hsv, 255]);
    cv.cvtColor(color, color, cv.COLOR_HSV2RGB);

    let dominant_color_rgb = Array.from(color.data);

    color.delete();
    mat.delete();

    return dominant_color_rgb;
}

export function load_map_from_image(cv, image) {
    let img = cv.imread(image);
    let gray = new cv.Mat();

    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY, 0);
    // let blur = new cv.Mat();
    // cv.GaussianBlur(img, img, new cv.Size(1, 1), 1);

    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.Canny(gray, edges, 100, 200);
    let kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
    cv.GaussianBlur(edges, edges, new cv.Size(5, 5), 1);

    kernel = new cv.Mat.ones(11, 11, cv.CV_8U);
    cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1)

    kernel.delete();
    kernel = new cv.Mat.ones(13, 13, cv.CV_8U);
    cv.erode(edges, edges, kernel, new cv.Point(-1, -1), 1)
    kernel.delete();

    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let max_contour = contours.get(0);
    let max_area = cv.contourArea(max_contour);

    for (let i = 1; i < contours.size(); ++i) {
        let area = cv.contourArea(contours.get(i));

        if (area > max_area) {
            max_area = area;
            max_contour = contours.get(i);
        }
    }

    console.log(contours.size());

    let board_bbox = cv.boundingRect(max_contour)
    let div_votes = {};

    for (let i = 0; i < contours.size(); ++i) {
        let { width, height } = cv.boundingRect(contours.get(i));
        let mid = Math.floor((width + height) / 2);
        let divs = Math.floor(board_bbox.width / mid);

        if (divs > 2 && divs < 12) {
            if (!(divs in div_votes))
                div_votes[divs] = 0

            div_votes[divs]++;
        }
    }

    let divs = Object.keys(div_votes).reduce((a, b) => div_votes[a] > div_votes[b] ? a : b);
    let tile_size = board_bbox.width / divs;
    console.log(`divisions: ${divs}`);

    let colors = [];
    let threshold = 16;
    let map = [];

    for (let i = 0; i < divs; i++)
    map.push([]);

    for (let y = 0; y < divs; y++) {
        label: for (let x = 0; x < divs; x++) {
            let pos_x = x * tile_size + board_bbox.x;
            let pos_y = y * tile_size + board_bbox.y;

            let roi = new cv.Rect(pos_x, pos_y, tile_size, tile_size);
            let dominant_color = get_dominant_color(cv, img, roi, { threshold });
            let dominant_color_as_hash = to_hash(dominant_color);

            for (let i = 0; i < colors.length; i++) {
                const color = colors[i];

                if (is_similar(from_hash(color), dominant_color, threshold)) {
                    map[y][x] = i + 1;
                    continue label;
                }
            }

            colors.push(dominant_color_as_hash);
            map[y][x] = colors.length;
        }
    }

    gray.delete();
    img.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

    colors = colors.map(color => `rgb(${color})`);
    colors = ['', ...colors];

    return { color_map: colors, map: map };
};
