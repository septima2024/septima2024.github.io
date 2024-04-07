#!/usr/bin/python3

# creates rotated versions of images from `./images_src/`
# output files are `./images/[prev_filename][rot_id].png`

import os
from PIL import Image
 
for file in os.listdir("./images_src/"):
    noext = file.rsplit('.', 1)[0]
    img = Image.open("./images_src/"+file)
    for i in range(4):
        img.save("./images/"+noext+str(i)+".png")
        img = img.transpose(Image.ROTATE_90)

