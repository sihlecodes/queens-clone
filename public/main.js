import { Game } from './js/game.js';
import { load_map_from_image } from './js/load_map.js';

const game = new Game();

main();

function main() {
    register_actions();

    game.start();
}

function register_actions() {
    const btn_clear = document.getElementById('btn-clear');
    const btn_load = document.getElementById('btn-load');
    const file_picker = document.getElementById('file-picker');
    const image = document.getElementById('load-target');

    image.onload = async () => {
        cv = await cv;

        load_map_from_image(image)
            .then((response) => game.reload(response))
            .catch((error) => console.log(error));
    };

    file_picker.onchange = (e) => {
        let file = e.target.files[0];

        if (!file)
            return;

        let reader = new FileReader();

        reader.onload = (e) => image.src = e.target.result;
        reader.readAsDataURL(file);
    };

    btn_clear.onclick = () => game.clear();
    btn_load.onclick = () => file_picker.click();
}
