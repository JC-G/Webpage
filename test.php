<?php
$dir = new DirectoryIterator(dirname(__FILE__));
foreach ($dir as $fileinfo) {
    if (!$fileinfo->isDot()) {
        var_dump($fileinfo->getFilename());
    }
}
?>

<html>

<head>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/latest.js?config=TeX-MML-AM_CHTML' async></script>

</head>
<body>

    <?php
    $dir = new DirectoryIterator(dirname(__FILE__));
    foreach ($dir as $fileinfo) {
        if (!$fileinfo->isDot()) {
            echo($fileinfo->getFilename());
        }
    }
    ?>
    <!--
        we want to put each post in a box and display it
    -->

    
    <h1>test</h1>

    <p>$$\int_0^\infty$$</p>
</body>
</html>