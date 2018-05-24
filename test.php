

<html>

<head>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/latest.js?config=TeX-MML-AM_CHTML' async></script>

</head>
<body>

    <?php
    $dir = new DirectoryIterator("posts");
    foreach ($dir as $fileinfo) {
        if (!$fileinfo->isDot()) {



            $fileName = $fileinfo->getPathname();
            echo($fileName);
            $myFile = fopen($fileName,"r");
            echo "File Contents:" . fread($myFile,filesize($fileName))."<br>";
            fclose($myFile);
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