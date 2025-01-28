<div align="center">
<h1>Queens Clone</h1>
<img src="docs/logo.svg" width="50%"></img>
<br>
<br>
  
![Badge License](https://img.shields.io/badge/License-MIT-brightgreen)
![Badge YearCreated](https://img.shields.io/badge/Year_created-2024-orange)
![Badge Language](https://img.shields.io/badge/Language-Javascript-cornflowerblue)
</div>

A clone of the LinkedIn game [queens](https://linkedin.com/games/queens).
I created this project for learning purposes. My clone has most of the basic
features of the game as well as my own unique feature for loading maps from
screenshots (using opencv).

The clone is live at https://sihlecodes.github.io/queens-clone.

## Getting the project to run (locally)

This project is made entirely out of vanila HTML, CSS, and Javascript. That
means you could, in theory, just open up the `index.html` and have it work.
However, I made use of Javascript modules which means that the project does
require some form of http server to run. I chose to use node.js along with
express and livereload for my server. So, you can get the project running with
the following commands (assuming you have git and node installed on your system):

```shell
git clone https://github.com/sihlecodes/queens-clone.git
cd queens-clone
npm install
npm start
```

Then open http://localhost:3050 in your browser.

## Motivation

I loved playing the original game so much that I wanted to play more of it, but
unfortunately you only get one puzzle a day. I looked for clones online but most
of them have janky controls, or controls that just don't feel as good as the
controls of the original game. So, I set out to make a clone with almost identical
feeling controls.

## Features

### Available

* **Base game features**<br>
Placing marks and queens as well as detecting when the game has been completed or
when the board has errors. Clearing the board, timing, etc. Consider checking out
the [original game](https://linkedin/games/queens) for a comparison.

* **Screenshot map loading**<br>
Using opencv, you have the ability to load game maps from screenshots of the game.
Using this feature you can even load maps that have been played through.
However, the feature is unable to load maps that have error markings on them.
It also fails if the screenshot includes has a block that is hovered on (with the mouse).

### Features that I might implement if I get bored enough :sweat_smile:

- **Map generation**<br>
Add the ability to create new maps randomly.

- **Auto X's**<br>
Automatically place X's when a queen is placed. Originally, I didn't add this feature
as a part of the base game because I actually enjoy the process of placing all the
X's manually.

## Challenges

For this project my biggest challenge was probably dealing with all the abstraction
I made early. In trying to keep the same abstractions alive, I found myself having
to change large portions of some systems in order to add new features.

Another challenge/something to note for future projects is that the development of
this project was relatively quick at the beginning, but at some point in the middle
of I ended up making none advancing changes. By non adavancing, I mean changes that
make the code look pretty but don't really affect how the system behaves in the view
point of a user. I'm a perfectionist (aren't we all) so I constantly get the urge to
"improve" things.

Oh yeah, I also had to learn a bit of opencv in the process of making this clone.
So that was a rather fun challenge. Also, I'm sure I'll be able to use some of this
knowledge for future projects (well atleast I won't have to learn all the basics
all over again :sweat_smile:).
