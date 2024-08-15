# Experimental Suite for Rendering 3D Chladni Patterns. 

In Skrodzki et al. 2016 [1], the authors described the generation of 3D Chladni patterns. These are visually striking and find rich applications, e.g., in architecture or instrument design. While the paper shows several renderings, no open-source implementation is available. The project aims to create a web application that allows users to render and export their Chladni patterns. This will involve, e.g., handling implicit surface descriptions and the marching cubes algorithm. Ideally, the tool will enable researchers to investigate the relationship between Chladnis figures and eigenfunctions and help in answering the question of whether there are two different 3D shapes with the same Chladni figures (along the lines of the “Hear the shape of a drum” paper for 2D shapes).

**Prerequisites**:  No strict prerequisites, knowledge of 3D web development / JavaScript / HTML5 is a bonus.

## How to setup website locally (for editing and contribution)
* cd ./chladni
* (node.js installation) (brew install node (for Mac))
* npm install (installs dependencies of node.js)
* (conda installation)
* conda env create -f environment.yml
* conda activate chladni
  
## How to run website locally

* cd ./chladni
* conda activate chladni    
* python manage.py runserver
* open http://127.0.0.1:8000/ in your browser

## ShaderToy Implementation
In case you would like to render the Chladni surface in ShaderToy, an implementation can be found [here](https://www.shadertoy.com/view/lfsfzN#) based on an existing marching cubes implementation[4].

To apply your custom variable values to the shadertoy, perform the following:

### Screen Resolution Adjustments
Change the resolution according to your screen resolution in the "Common" tab of the shader program. You can see your viewer resolution in shadertoy. If you are using fullscreen to view the shader, instead put in your actual screen resolution. So for a viewer of resolution `768 x 432`, the resolution variables will be typed as follows: 

![image](https://github.com/user-attachments/assets/ac83cedb-3872-4a69-87c4-ab862c245a88)

These changes ensure you view the function in the bounds of `(-1,-1,-1)` to `(1,1,1)`

### Chladni Figure Adjustments
To change variables for the resulting Chladni figure, go to "Buffer B" tab of the shader program.

In the tab, the `map` function performs the calculation of the value of the pattern at a point in space. Here you can change the following variables to map your output in the webviewer.

![image](https://github.com/user-attachments/assets/649fd63e-a372-49db-96c8-3ec89910cd04)


To change boundary condition, change the value of type to either 0.0 for Dirichlet boundary condition or 1.0 for Neumann boundary condition for the function.

![image](https://github.com/user-attachments/assets/052492cd-3c70-4024-b803-2d3e36e9f256)



## Reference Code and Papers: 



- [1] [Chladni Figures Revisited: A Peek Into The Third Dimension, Martin Skrodzki, Ulrich Reitebuch, and Konrad Polthier](https://archive.bridgesmathart.org/2016/bridges2016-481.html)
- [2] [Marching Cubes ThreeJS](https://github.com/timoxley/threejs/blob/master/examples/webgl_marching_cubes.html)
- [3] [Chladni Figures: A Mathematical
Exploration of Visual Music](https://www.maturitaetsarbeiten.ch/cms/images/2022_2/Quistad_Evan/Evan_Quistad_Maturarbeit.pdf)
- [4] [Marching Cubes on Shader Toy](https://www.shadertoy.com/view/ftXGDj)
