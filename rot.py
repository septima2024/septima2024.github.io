#!/usr/bin/python3

# creates rotated versions of images from `./images_src/`
# output files are `./images/[prev_filename][rot_id].png`

import os
from PIL import Image

tile_names = [
    "O_01",       "O_11",       "C_02", "C_12",
    "O_00",       "O_10",       "C_01",
    "L-small_01", "L-small_11", "C_00", "C_10",
    "Q_02",       "L-small_10",         "P_12",
    "Q_01",       "Q_11",       "P_01", "P_11",
    "Q_00",       "Q_10",       "P_00", "P_10",
    # End of file 1
    "O-small_00", "I-small_01", "L_02", "L_12",
    "I_03",       "I-small_00", "Z_12", "L_11",
    "I_02",       "Z_01",       "Z_11", "L_10",
    "I_01",       "Z_00",       "T_11",
    "I_00",       "T_00",       "T_10", "T_20",
    # End of file 2
                                "J_02", "J_12",
                                "J_01",
                                "J_00",
                  "S_02",
                  "S_01",       "S_11",
                                "S_10",
    # End of file 3
]

j = 0
for file in os.listdir("./images_src/"):
    # noext = file.rsplit('.', 1)[0]
    noext = tile_names[j]
    if noext == None:
        continue
    img = Image.open("./images_src/"+file)
    for i in range(4):
        img.save("./images/"+noext+"_"+str(i)+".png")
        img = img.transpose(Image.ROTATE_90)
    j += 1
