import { default_map } from './maps.js';

export const Configuaration = {
    RENDER_OFFSET: 5,
    map: default_map,

    theme: {
        invalid: {
            mark: {
                filter: 'url(#invalid_mark_filter)',
                pattern: 'url(#invalid_mark_pattern)',
            },

            queen: {
                filter: 'url(#invalid_queen_filter)',
            }
        },

        hover: { color: '#5554' },
        color_map: {
            1: '#b7a5dd',
            2: '#a4bef9',
            3: '#e7f297',
            4: '#f1cb9a',
            5: '#e58268',
            6: '#dfdfdf',
            7: '#b7b2a0',
            8: '#bedda7',
            9: '#b1d1d7',
            10: '#99ece9',
            11: '#d1a3bd',
        },

        outlines: {
            outer: {
                border: {
                    width: 4,
                    color: 'black',
                },
            },

            inner: {
                border: {
                    width: 2.5,
                    color: 'black',
                },

                separator: {
                    width: 1,
                    color: '#444',
                },
            },
        },
    },
}