<?php

exec('node scrape.js', $output);

foreach ($output as $line) {
    echo $line . PHP_EOL;
}


