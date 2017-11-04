
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

// fiters

// var filterDefs = d3.select('svg')
//   .append('defs')

// var blurFilterWrap = d3.select('svg')
//   .append('filter')
//   .attr('id', 'blurFilter')

// var blurFilter = d3.select('blurFilterWrap')
//   .append('feGaussianBlur')
//   .attr('in', 'SourceGraphic')
//   .attr('stdDeviation', 5)


var container = d3.select('svg')
  .append("svg:g")
  .attr('width', width)
  .attr('height', height)
  .classed('container', true)

var currentSynColor = '#4A90E2'


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
    .attr('fill', currentSynColor);

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

  var cardWidth = 186,
      cardHeight = 100
      ;

  var cardOffsetX = -cardWidth,
      cardOffsetY = -cardHeight
      ;

  // var cardWrap = g.append('svg:foreignObject')
  //   // note that foreignObject may require body at some point...
  //   .classed('card-wrap', true)

  var shadowCard = g.append('svg:rect')
    .attr('fill', 'rgba(0, 17, 49, 0.1)')
    .attr('width', 194)
    .attr('height', 108)
    .attr('ry', 8)
    .attr('rx', 8)
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
    .attr('rx', 5)
    .attr('ry', 5)
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

  var cardCorner = cardHTMLWrap.append('xhtml:div')
    .classed('card-corner', true)

  function synExpand() {

    var currentSyn = d3.select(this);
    var currentCard = currentSyn.select('.syn .card')

    var cardExpandedWidth = 480;
    var cardExpandedHeight = 360;

    currentCard
      .attr('x', cardOffsetX * 2)
      .attr('y', cardOffsetY * 2)
      .attr('width', cardExpandedWidth)
      .attr('height', cardExpandedHeight)
      ;

    currentSyn.select('.card-input-wrap')
      .attr('x', cardOffsetX * 2)
      .attr('y', cardOffsetY * 2)

    currentSyn.select('.syn .card-shadow')
      // numbers are just margins, not magic
      .attr('x', (cardOffsetX * 2) - 4)
      .attr('y', (cardOffsetY * 2) - 4)
      .attr('width', cardExpandedWidth + 8)
      .attr('height', cardExpandedHeight + 8)
      ;

    var buttonSave = currentSyn.append('svg:circle')
      .attr('r', 25)
      .attr('cx', cardOffsetX)
      .attr('cy', (cardOffsetY * 2) + cardExpandedHeight + 8)
      .attr('fill', currentSynColor)
      .on('click', synCollapse)
      .classed('node-action', true)


    d3.select(this).select('.syn .card-marker')
      .remove()
      ;

    // d3.select(this).select('.syn .card-node-shadow')
    //   .remove()
    //   ;

    // d3.select(this).select('.syn .card-node')
    //   .remove()
    //   ;

    // disable event listner on card container (syn)
    currentSyn
      .on('click', null)
      .classed('syn-expanded', true)

    function synCollapse () {

      // prevents propagation fuckery on expand / collapse events of syn
      d3.event.stopPropagation();

      currentCard
        .attr('x', cardOffsetX)
        .attr('y', cardOffsetY)
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        ;

      currentSyn.select('.syn .card-shadow')
        .attr('width', cardWidth + 8)
        .attr('height', cardHeight + 8)
        .attr('x', cardOffsetX - 4)
        .attr('y', cardOffsetY - 4)
        ;

      currentSyn.select('.syn .card-input-wrap')
        .attr('x', cardOffsetX)
        .attr('y', cardOffsetY)
        ;

      currentSyn.select('.node-action')
        .remove()
        ;

      currentSyn
        .on('click', synExpand)
        .classed('syn-expanded', false)

      // createCardNode();

    }

  }



// Returns path data for a rectangle with rounded right corners.
// Note: it’s probably easier to use a <rect> element with rx and ry attributes!
// The top-left corner is ⟨x,y⟩.

  // var cardMarker = g.append('svg:path')
  //   .attr('fill', currentSynColor)
  //   .attr('d', 'M0,9.99322906 C0,7.2355448 2.24419519,5 5,5 L10,5 L10,105 L5,105 C2.23857625,105 0,102.77115 0,100.006771 L0,9.99322906 Z')
  //   .attr('transform', 'translate(-170 -90)')
  //   .classed('card-marker', true)


  function createCardNode() {

    var cardNode = g.append('svg:circle')
      .attr('class', 'card-node')
      .attr('r', 10)
      .attr('cx', 0)
      .attr('cy', 0)
      .style('fill', '#35649C')
      // .classed('fab', function(d) { return d.reflexive; })

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
          .style('cursor', '-webkit-grabbing')
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

  // show node IDs
  // g.append('svg:text')
  //     .attr('x', 0)
  //     .attr('y', 4)
  //     .attr('class', 'id')
  //     .text(function(d) { return d.id; });

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




