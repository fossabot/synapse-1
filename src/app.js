console.log("double working");

import * as d3 from 'd3';

// set up the SVG

var width = window.innerWidth,
    height = window.innerHeight;

var zoom = d3.behavior.zoom()
    .scaleExtent([0.25, 1])
    .on("zoom", zoomed);

var body = d3.select('body')
  .call(zoom)

var fullNode = document.querySelector('.full-node')

var svg = d3.select('body')
  .append('svg:svg')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height)
  .classed('canvas', true)

var container = d3.select('svg')
  .append("svg:g")
  .attr('width', width)
  .attr('height', height)
  .classed('container', true)

var currentSynColor = '#4A90E2'

var filter = svg.append("defs")
  .append("filter")
  .attr("id", "blur")
  .append("feGaussianBlur")
  .attr("stdDeviation", 5)
  ;

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.


var nodes = [
      {id: 0, reflexive: false},
      {id: 1, reflexive: false},
      {id: 2, reflexive: false}
    ],

    lastNodeId = 2,

    links = [
      {source: nodes[0], target: nodes[1], left: false, right: true },
      {source: nodes[1], target: nodes[2], left: false, right: true }
    ];

localStorage.setItem("nodeValue", JSON.stringify(nodes))

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(550)
    .charge(-500)
    .on('tick', tick)

var drag = force.drag()
  .on("dragstart", dragstart);

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', currentSynColor)
    .style('cursor', '-webkit-grabbing')
    ;

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', currentSynColor);

// line displayed when dragging new nodes
var drag_line = container.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0')

// handles to link and node element groups
var path = container.append('svg:g').selectAll('path'),
    circle = container.append('svg:g').selectAll('g');

// fix mouse coordinates transform issue
var zoomTranslateX = 0;
var zoomTranslateY = 0;
var zoomScale = 1;

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 32 : 0,
        targetPadding = d.right ? 32 : 0,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

  // remove old links
  path.exit().remove();

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .classed('reflexive', function(d) { return d.reflexive; });

  // add new nodes

  var g = circle.enter().append('svg:g')
    .call(drag)
    // .on('click', synExpand)
    .on('mousedown', function() {
      d3.event.stopPropagation();
    })
    .classed('syn', true)
    ;

  function createCardNode() {


  var cardWidth = 186,
      cardHeight = 100
      ;

  var cardOffsetX = -cardWidth -15,
      cardOffsetY = -cardHeight -15
      ;

  var cardExpander = g.append('svg:rect')
    .attr('height', 190)
    .attr('width', 290)
    .attr('x', -270)
    .attr('y', -160)
    .attr('fill', 'rgba(0,0,0,0)')
    ;

  var shadowCard = g.append('svg:rect')
    .attr('fill', 'rgba(0, 17, 49, 0.1)')
    .attr('width', 194)
    .attr('height', 108)
    .attr('ry', 12)
    .attr('rx', 12)
    .attr('x', cardOffsetX - 4)
    .attr('y', cardOffsetY - 4)
    .classed('card-shadow', true)
    ;

  var cardNodeShadow = g.append('svg:circle')
    .attr('r', 10)
    .attr('cx', 0)
    .attr('cy', 0)
    .style('fill', currentSynColor)
    .classed('card-node-shadow', true)
    ;

  var card = g.append('svg:rect')
    .attr('fill', 'rgba(255,255,255,1')
    .attr('width', cardWidth)
    .attr('height', cardHeight)
    .attr('x', cardOffsetX)
    .attr('y', cardOffsetY)
    .attr('rx', 10)
    .attr('ry', 10)
    .classed('card', true)
    ;

  var cardHTMLWrap = g.append('svg:foreignObject')
    .attr('width', cardWidth)
    .attr('height', cardHeight)
    .attr('x', cardOffsetX)
    .attr('y', cardOffsetY)
    .classed('card-html-wrap', true)
    ;

  var cardInput = cardHTMLWrap.append('xhtml:textarea')
    .attr('type', 'text')
    .attr('spellcheck', false)
    .classed('card-input', true)
    ;

  var cardCorner = g.append('svg:rect')
    .attr('width', 11)
    .attr('height', 11)
    .attr('x', -26)
    .attr('y', -26)
    .attr('fill', '#fff')
    ;

  var cardAction = g.append('svg:rect')
    .attr('width', 25)
    .attr('height', 25)
    .attr('fill', currentSynColor)
    .attr('x', -215)
    .attr('y', -105)
    .classed('card-action', true)
    .on('click', synExpand)
    ;

  var cardActionCircle =g.append('svg:circle')
    .attr('r', 12)
    .attr('cx', -255)
    .attr('cy', -140)
    .attr('fill', '#FF5E9C')
    .classed('card-action-circle', true)
    ;

  var cardActionSquare = g.append('svg:rect')
    .attr('width', 9)
    .attr('height', 9)
    .attr('x', -200)
    .attr('y', -150)
    .attr('fill', '#ffffff')
    .classed('card-action-square', true)
    ;

    document.querySelector('.card-input').value = localStorage.getItem("nodeValue");

    function synExpand(d) {

      var cardExpandedWidth = 380,
          cardExpandedHeight = 260
          ;

      var currentCardAction = d3.select(this);

      d3.selectAll(".syn")
        .attr("filter", "url(#blur)")
        .attr("fill-opacity", 0.9)
        ;

      var currentSyn = d3.select(this.parentNode)
          .classed('syn-expanded', true)
          .attr("filter", false)
          .attr("fill-opacity", 1)
          ;

      var currentCard = currentSyn.select('.syn .card')
        .attr('x', -(cardExpandedWidth +15))
        .attr('y', -(cardExpandedHeight +15))
        .attr('width', cardExpandedWidth)
        .attr('height', cardExpandedHeight)
        ;

      var currentCardHTMLWrap = currentSyn.select('.syn .card-html-wrap')
        .attr('x', -(cardExpandedWidth +15))
        .attr('y', -(cardExpandedHeight +15))
        .attr('width', cardExpandedWidth)
        .attr('height', cardExpandedHeight)
        ;

      var currentAction = currentSyn.select('.syn .card-action')
        .attr('width', 50).attr('height', 50)
        .attr('x', -455).attr('y', -260)
        .attr('rx', 50).attr('ry', 50)
        .on('click', synCollapse)
        ;

      var saveGroup = currentSyn.append('svg:g')
        .classed('card-save', true)
        .attr('transform', 'translate(-443, -248) scale(1)')
        .on('click', synCollapse)
        ;

      var saveRect1 = saveGroup.append('svg:rect')
        .attr('fill', '#ffffff')
        .attr('x', 0).attr('y',0)
        .attr('width', 26).attr('height', 26)
        .attr('rx', 3)
        ;

      var saveRect2 = saveGroup.append('svg:rect')
        .attr('fill', '#4A90E2')
        .attr('opacity', 0.65)
        .attr('x', 3).attr('y',12)
        .attr('width', 20).attr('height', 11)
        .attr('rx', 2)
        ;

      var savePath = saveGroup.append('svg:path')
        .attr('d', 'M9,0 L23,0 L23,6 L23,6 C23,7.1045695 22.1045695,8 21,8 L11,8 L11,8 C9.8954305,8 9,7.1045695 9,6 L9,0 Z')
        .attr('fill', '#4A90E2')
        .attr('opacity', '0.65')
        ;

      var saveRect3 = saveGroup.append('svg:rect')
        .attr('fill', '#ffffff')
        .attr('x', 18).attr('y', 1)
        .attr('width', 3).attr('height', 6)
        .attr('rx', 1.5)
        ;

      var saveRect4 = saveGroup.append('svg:rect')
        .attr('fill', '#4A90E2')
        .attr('opacity', 0.65)
        .attr('x', 3).attr('y', 3)
        .attr('width', 3).attr('height', 3)
        .attr('rx', 1.5)
        ;


      function synCollapse(d) {

        var currentValue = this.parentNode.querySelector('.card-input').value;
        var currentNode = JSON.stringify(nodes[d.id]);

        // push content to node
        var currentNodeValue = currentNode.content = currentValue;

        console.log(currentNode)
        console.log(nodes)
        console.log(currentNodeValue)

        localStorage.setItem("nodeValue", currentNodeValue);

        //

        currentSyn = d3.select(this.parentNode)
          .classed('syn-expanded', false)
          ;

        d3.selectAll(".syn")
          .attr("filter", false)
          .attr("fill-opacity", 1)
          ;

        saveGroup.remove();

        currentCard
          .attr('width', cardWidth)
          .attr('height', cardHeight)
          .attr('x', cardOffsetX)
          .attr('y', cardOffsetY)
          ;

        currentCardHTMLWrap
          .attr('width', cardWidth)
          .attr('height', cardHeight)
          .attr('x', cardOffsetX)
          .attr('y', cardOffsetY)
          ;

        currentCardAction
          .attr('width', 25)
          .attr('height', 25)
          .attr('fill', currentSynColor)
          .attr('x', -215)
          .attr('y', -105)
          .attr('rx', 0)
          .attr('ry', 0)
          .classed('card-action', true)
          .on('click', synExpand)
      }

    }

    var cardNode = g.append('svg:circle')
      .attr('class', 'card-node')
      .attr('r', 10)
      .attr('cx', 0)
      .attr('cy', 0)
      .style('fill', '#35649C')
      .on('click', function(d) {
        console.log(d.id);
      })


      .on('mouseover', function(d) {
        if(!mousedown_node || d === mousedown_node) return;
      })
      .on('mouseout', function(d) {
        if(!mousedown_node || d === mousedown_node) return;
      })
      .on('mousedown', function(d) {
        if(d3.event.ctrlKey) return;
        d3.event.stopPropagation();

        // select node
        mousedown_node = d;
        if(mousedown_node === selected_node) selected_node = null;
        else selected_node = mousedown_node;
        selected_link = null;

        // reposition drag line

        drag_line
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

      })
      .on('mouseup', function(d) {
        if(!mousedown_node) return;

        // needed by FF
        drag_line
          .classed('hidden', true)
          .style('marker-end', '');

        // check for drag-to-self
        mouseup_node = d;
        if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

        // unenlarge target node
        d3.select(this).attr('transform', '');

        // add link to graph (update if exists)
        // NB: links are strictly source < target; arrows separately specified by booleans
        var source, target, direction;
        if(mousedown_node.id < mouseup_node.id) {
          source = mousedown_node;
          target = mouseup_node;
          direction = 'right';
        } else {
          source = mouseup_node;
          target = mousedown_node;
          direction = 'left';
        }

        var link;
        link = links.filter(function(l) {
          return (l.source === source && l.target === target);
        })[0];

        if(link) {
          link[direction] = true;
        } else {
          link = {source: source, target: target, left: false, right: false};
          link[direction] = true;
          links.push(link);
        }

        // select new link
        selected_link = link;
        selected_node = null;

        restart();
      });
    }
    createCardNode();


  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

function mousedown() {
  // prevent I-bar on drag
  d3.event.preventDefault();

  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

}

function mousemove(e) {

  var adjustedMouseX = (d3.mouse(this)[0] - zoomTranslateX) / zoomScale;
  var adjustedMouseY = (d3.mouse(this)[1] - zoomTranslateY) / zoomScale;

  if(!mousedown_node) return;
  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + adjustedMouseX + ',' + adjustedMouseY);

}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function rightclick() {
  // insert a new node at mouse position
  var pos = d3.mouse(this),
      node = {id: ++lastNodeId, reflexive: false};
  node.x = pos[0];
  node.y = pos[1];
  nodes.push(node);

  restart();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

function zoomed() {

    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

    // fix mouse position offset by transform
    zoomTranslateX = d3.event.translate[0];
    zoomTranslateY = d3.event.translate[1];

    zoomScale = d3.event.scale;

}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup)
  .on('contextmenu', rightclick);


restart();
