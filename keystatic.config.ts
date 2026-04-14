import { config } from '@keystatic/core';

// Automatically import all objects exported from these files
import * as collections from './src/keystatic/collections';
import * as singletons from './src/keystatic/singletons';

export default config({
    storage: {
        kind: 'local', 
    },
    collections,
    singletons,
});