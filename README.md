# Experimental Suite for Rendering 3D Chladni Patterns. 

In Skrodzki et al. 2016 [1], the authors described the generation of 3D Chladni patterns. These are visually striking and find rich applications, e.g., in architecture or instrument design. While the paper shows several renderings, no open-source implementation is available. The project aims to create a web application that allows users to render and export their Chladni patterns. This will involve, e.g., handling implicit surface descriptions and the marching cubes algorithm. Ideally, the tool will enable researchers to investigate the relationship between Chladnis figures and eigenfunctions and help in answering the question of whether there are two different 3D shapes with the same Chladni figures (along the lines of the “Hear the shape of a drum” paper for 2D shapes).

**Prerequisites**:  No strict prerequisites, knowledge of 3D web development / JavaScript / HTML5 is a bonus.

## How to setup
* cd ./chladni
* (node.js installation) (brew install node (for Mac))
* npm install (installs dependencies of node.js)
* (conda installation)
* conda env create -f environment.yml
* conda activate chladni
  
## How to run
* cd ./chladni
* conda activate chladni    
* python manage.py runserver
* open http://127.0.0.1:8000/ in your browser

## Reference Code and Papers: 



- [1] [Chladni Figures Revisited: A Peek Into The Third Dimension, Martin Skrodzki, Ulrich Reitebuch, and Konrad Polthier](https://archive.bridgesmathart.org/2016/bridges2016-481.html)
- [2] [Marching Cubes ThreeJS](https://github.com/timoxley/threejs/blob/master/examples/webgl_marching_cubes.html)
