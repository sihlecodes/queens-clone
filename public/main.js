import { Game } from './js/game.js';
import { load_map_from_image } from './js/load_map.js';

const game = new Game();

main();

function main() {
    register_actions();
    hide_loading_banner();

    game.start();
}

function register_actions() {
    const btn_clear = document.getElementById('btn-clear');
    const btn_load = document.getElementById('btn-load');
    const file_picker = document.getElementById('file-picker');
    const image = document.getElementById('load-target');

    image.onload = async () => {
        cv = await cv;

        await load_map_from_image(image)
            .then((response) => game.reload(response))
            .catch((error) => console.log(error));

        hide_loading_banner();

    };

    file_picker.onchange = (e) => {
        let file = e.target.files[0];

        if (!file)
            return;

        show_loading_banner();

        let reader = new FileReader();

        reader.onload = (e) => image.src = e.target.result;
        reader.readAsDataURL(file);
    };

    const loader = document.getElementById('loading-banner');

    loader.addEventListener('transitionend', () => {
        loader.classList.add('not-rendered');
    });

    document.querySelector('.spinner').addEventListener('animationend', () => {
        loader.classList.add('hidden');
    });

    btn_clear.onclick = () => game.clear();
    btn_load.onclick = () => file_picker.click();
}

function show_loading_banner() {
    document.querySelector('.spinner-bar').style.animationPlayState = 'running';
    document.getElementById('loading-banner')
        .classList.remove('animate-closing', 'not-rendered', 'hidden');
}

function hide_loading_banner() {
    setTimeout(() => {
        document.querySelector('.spinner-bar').style.animationPlayState = 'paused';
        document.getElementById('loading-banner').classList.add('animate-closing');
    }, 500);

}
