<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Settings</title>
    <link rel="icon" href="apple.png" type="image/x-icon"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css" />
  </head>

  <body bgcolor="black">
    <form action="settings.php" method="post" id="ui">
      <input type="text" name="tm_url" id="urlinput" /><br />
      <input type="submit" id="savebtn" value="Save" />
    </form>
    <br />
    <div id='msg'>
      <?php
        if (isset($_POST['tm_url'])) {
          $file = 'url.txt';
          
          $url = $_POST['tm_url'];

          if (empty($url)) {
            echo('Empty URL, nothing saved.');
          } else {
            file_put_contents($file, $url);
            echo('Saved');
          }
        }
      ?>
    </div>
  </body>
</html>
