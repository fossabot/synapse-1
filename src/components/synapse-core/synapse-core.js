import 'Components/synapse-core/synapse-core.scss';
import d3 from 'd3';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'Components/firebase-config';
import  { triggerSaveIndicator, triggerDeleteIndicator }
        from 'Components/synapse-ui/synapse-ui';

// Global data vars

var nodes,
    lastNodeId,
    links
    // viewportSnapXY,
    // viewportSnapScale;

window.nodes = nodes;

var nodesMap = {};

// FIREBASE SYNC

// <-- write data
var synUISync = document.querySelector('.syn-ui-sync');
var userId;

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        userId = firebase.auth().currentUser.uid;
    }
    else {}
});

synUISync.addEventListener('click', e => {

  // TODO: get viewport snapshot

  // let viewportSnapXY = document.querySelector('.container')
  //   .getAttribute('transform')
  //   .match(/translate\((.*),(.*)\)[^]/)
  //   ;

  // let viewportSnapScale = document.querySelector('.container')
  //   .getAttribute('transform')
  //   .match(/scale\((.*)\)/)
  //   ;

  // console.log(viewportSnapXY[1], viewportSnapXY[2], viewportSnapScale[1]);

  // write to firebase
    firebase.database().ref().child(userId).set({
        nodes,
        lastNodeId,
        links
        // viewportSnapXY,
        // viewportSnapScale
    });

    triggerSaveIndicator('Graph saved!')
})
// -->

// <-- read data

var dbRef = firebase.database().ref();

// get nodes and links from db and init force layout
dbRef.once('value').then(function(snapshot) {

    // get nodes
    nodes = snapshot.child(userId + "/nodes").val();
    lastNodeId = snapshot.child(userId + "/lastNodeId").val();
    links = snapshot.child(userId + "/links").val();
    // viewportSnapXY = snapshot.child(userId + "/viewportSnap").val();
    // if there are no nodes (first time login) – init starter data
    if (nodes === null) {
        nodes = [
            {id: 0, reflexive: false, content: ''},
            {id: 1, reflexive: false, content: ''},
            {id: 2, reflexive: false, content: ''}
        ];

        lastNodeId = 2;

        links = [
            {
                source: nodes[0],
                target: nodes[1],
                left: false,
                right: true
            },
            {
                source: nodes[1],
                target: nodes[2],
                left: false,
                right: true
            }
          ];

    } else {

    // Ivo's fix for mapping the right nodes to links
    for (var n in nodes) {
        nodesMap[nodes[n].id] = nodes[n];
    }

    var tempLinks = [];

    for (var l in links) {
        tempLinks.push({
            source: nodesMap[links[l].source.id],
            target: nodesMap[links[l].target.id]
        })
    }

    // TODO: looped tempLinks override left & right key-values, thus arrows are lost
    links = tempLinks;

    // links appears to be an object, despite it being an array
    console.log(typeof(links));
    }

    // init force layout
    forceInit();

});

// d3 force layout core (app core)
function forceInit() {

    // set up the SVG
    var width = window.innerWidth,
        height = window.innerHeight
        ;

    var zoom = d3.behavior.zoom()
        .scaleExtent([0.25, 1])
        .on("zoom", zoomed)
        ;

    var body = d3.select('body')
        .call(zoom)
        ;

    var fullNode = document.querySelector('.full-node');

    var svg = d3.select('body')
      .append('svg:svg')
      .attr('oncontextmenu', 'return false;')
      .attr('width', width)
      .attr('height', height)
      .classed('canvas', true)
      ;

    var container = d3.select('svg')
      .append("svg:g")
      .attr('width', width)
      .attr('height', height)
      // .attr('transform', 'translate(' + viewportSnapXY[1] + ',' + viewportSnapXY[2] + ') scale(' + viewportSnapScale[1] + ')'
      .classed('container', true)
      ;

    var currentSynColor = '#4A90E2';

    var filter = svg.append("defs")
      .append("filter")
      .attr("id", "blur")
      .append("feGaussianBlur")
      .attr("stdDeviation", 6)
      ;

    // set up initial nodes and links
    //  - nodes are known by 'id', not by index in array.
    //  - reflexive edges are indicated on the node (as a bold black circle).
    //  - links are always source < target; edge directions are set by 'left' and 'right'.

    // init D3 force layout
    var force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .size([width, height])
        .linkDistance(550)
        .charge(-500)
        .on('tick', tick)
        .start()
        ;
        window.force = force;
        window.links = links;
        window.nodes = nodes;

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
      ;

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

      restart();
    }

    // update graph (called when needed)
    function restart() {

      // path (link) group
      path = path.data(links);

      // update existing links
      path.classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        ;

      // add new links
      path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        .on('click', function(d) {
          if(d3.event.ctrlKey) return;

          // select link
          mousedown_link = d;
          if (mousedown_link === selected_link) selected_link = null;
          else selected_link = mousedown_link;
          selected_node = null;

          links.splice(links.indexOf(selected_link), 1);

          triggerDeleteIndicator('Link destroyed!')

          restart();
      });

      // remove old links
      path.exit().remove();


      // circle (node) group
      // NB: the function arg is crucial here, nodes are known by id, not by index!
      circle = circle.data(nodes, function(d) { return d.id; });

      // update existing nodes (reflexive & selected visual states)
      circle.selectAll('circle')
        .classed('reflexive', function(d) { return d.reflexive; });

      // create syn group
      var synGroup = circle.enter().append('svg:g')
        .call(drag)
        // future interaction
        // .on('click', synExpand)

        .on('mousedown', function() {
          d3.event.stopPropagation();
        })
        .classed('syn', true)

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
        ;

        function createSyn() {

            var cardWidth = 186,
                cardHeight = 100
                ;

            var cardOffsetX = -cardWidth -15,
                cardOffsetY = -cardHeight -15
                ;

            var cardExpander = synGroup.append('svg:rect')
              .attr('height', 180)
              .attr('width', 290)
              .attr('x', -260)
              .attr('y', -150)
              .attr('fill', 'rgba(0,0,0,0)')
              ;

            var cardHTMLWrap = synGroup.append('svg:foreignObject')
              .attr('width', cardWidth)
              .attr('height', cardHeight)
              .attr('x', cardOffsetX)
              .attr('y', cardOffsetY)
              .attr('scale', 1)
              .classed('card-html-wrap', true)
              ;

            var card = cardHTMLWrap.append('xhtml:textarea')
              .attr('type', 'text')
              .attr('spellcheck', false)
              .classed('card', true)
              ;

            var cardAction = synGroup.append('svg:rect')
              .attr('width', 30)
              .attr('height', 30)
              .classed('card-action', true)
              .on('click', synExpand)
              ;

            var cardNodeShadow = synGroup.append('svg:circle')
              .attr('r', 10)
              .attr('cx', 0)
              .attr('cy', 0)
              .classed('card-node-shadow', true)
              ;

            var cardNodeTri = synGroup.append('svg:polygon')
              .attr('points', '-0.0104805453 7.14973725 19.387564 0.603895056 13.4614341 19.8422849')
              .classed('card-node-tri', true)
              ;

            var cardNode = synGroup.append('svg:circle')
              .attr('class', 'card-node')
              .attr('r', 10)
              .attr('cx', 0)
              .attr('cy', 0)
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
                  .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y)
                  ;
                svg.classed('linking', true);

              })
              ;

              function synExpand(d) {

                // TO DO: explore merging drag and expand interactions:
                // var currentCoords = currentSyn[0][0].getAttribute('transform');
                // get the coords difference in conditional to avoid false expanse
 

                var cardExpandedWidth = 380,
                    cardExpandedHeight = 260
                    ;

                var currentCardAction = d3.select(this);

                d3.selectAll(".syn")
                  .attr("filter", "url(#blur)")
                  ;

                var currentSyn = d3.select(this.parentNode)
                    .classed('syn-expanded', true)
                    .attr("filter", false)
                    .on('keydown', enterCollapse)
                    ;

                var currentCardHTMLWrap = currentSyn.select('.syn .card-html-wrap')
                  // DUE TO FIREFOX FUCKERY
                  .attr('width', cardExpandedWidth)
                  .attr('height', cardExpandedHeight)
                  .attr('x', -(cardExpandedWidth + 15))
                  .attr('y', -(cardExpandedHeight + 15))
                  .attr('scale', 2)
                  ;

                // focus input on expand
                currentSyn.select('.syn .card')[0][0]
                  .focus()
                  ;

                var currentAction = currentSyn.select('.syn .card-action')
                  .on('click', synCollapse)
                  ;

                var synRemover = currentSyn.append('svg:g')
                  .classed('card-remover', true)
                  .on('click', synRemove)
                  ;

                var synRemoverCircle = synRemover.append('svg:circle')
                  .attr('r', 15)
                  .attr('fill', '#F75166')
                  ;

                var synRemoverRect = synRemover.append('svg:rect')
                  .attr('width', 13)
                  .attr('height', 6)
                  .classed('card-remover-rect', true)
                  ;

                function synRemove(d) {

                  var currentNodeId = nodes[d.id];

                  nodes.splice(nodes.indexOf(d), 1);
                  spliceLinksForNode(d);

                  d3.selectAll(".syn")
                    .attr("filter", false)
                  ;

                  restart();
                  console.log(nodes)

                  triggerDeleteIndicator('Node deleted!');

                }

                function synCollapse(d) {

                  // select current card value
                  var currentValue = this.parentNode.querySelector('.card').value;


                  // find current card node
                  var currentNode = nodes[d.index];
                  
                  console.log(currentNode);

                  // push current card content to current node (in object)
                  currentNode.content = currentValue;

                  // remove expanded state styles from synapse
                  currentSyn = d3.select(this.parentNode)
                    .classed('syn-expanded', false)
                  ;

                  d3.selectAll(".syn")
                    .attr("filter", false)
                  ;

                  currentCardHTMLWrap = currentSyn.select('.syn .card-html-wrap')
                    // DUE TO FIREFOX FUCKERY
                    .attr('width', cardWidth)
                    .attr('height', cardHeight)
                    .attr('x', cardOffsetX)
                    .attr('y', cardOffsetY)
                  ;

                  currentCardAction
                      .attr('r', 10)
                      .classed('card-action', true)
                      .on('click', synExpand)
                      ;

                  synRemover.remove();
                }

                function enterCollapse() {
                  
                    // TO DO: prevent shift+enter collapse
                    // if (d3.event.keyCode === 13 && d3.event.keyCode != 16) {
                    //   console.log('test')
                    // }

                    if (d3.event.keyCode === 13) {
                      
                      // select current card value
                      var currentValue = this.querySelector('.card').value;
  
                      // find current card node
                      var currentNode = nodes[d.index];

                      // push current card content to current node (in object)
                      currentNode.content = currentValue;

                      currentSyn
                        .classed('syn-expanded', false)
                        .select('.syn .card')[0][0]
                        .blur()
                      ;

                      d3.selectAll(".syn")
                        .attr("filter", false)
                      ;

                      currentCardHTMLWrap = currentSyn.select('.card-html-wrap')
                        // DUE TO FIREFOX FUCKERY
                        .attr('width', cardWidth)
                        .attr('height', cardHeight)
                        .attr('x', cardOffsetX)
                        .attr('y', cardOffsetY)
                      ;

                      currentSyn.select('.card-action')
                        .attr('r', 10)
                        .classed('card-action', true)
                        .on('click', synExpand)
                      ;

                      synRemover.remove();
                    }
                }
              }
          }

        createSyn();


      // remove old nodes
      circle.exit().remove();

      // set the force in motion
      force.start();
    }

    function mousedown() {
      // prevent I-bar on drag
      d3.event.preventDefault();

      svg.classed('active', true);

      if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    }

    function mousemove(e) {

      // scale clusterfuck mouse fix
      var adjustedMouseX = (d3.mouse(this)[0] - zoomTranslateX) / zoomScale;
      var adjustedMouseY = (d3.mouse(this)[1] - zoomTranslateY) / zoomScale;

      if(!mousedown_node) return;

      // update drag line
      drag_line.attr(
          'd', 'M' +
          mousedown_node.x +
          ',' +
          mousedown_node.y +
          'L' +
          adjustedMouseX +
          ',' +
          adjustedMouseY
      );

    }

    function mouseup() {
      if(mousedown_node) {
        // hide drag line
        drag_line
          .classed('hidden', true)
          .style('marker-end', '');
      }

      svg.classed('active', false);
      svg.classed('linking', false);

      // clear mouse event vars
      resetMouseVars();
    }

    function newNode() {

        // zoom / scale fix
        var adjustedMouseX = (d3.mouse(this)[0] - zoomTranslateX) / zoomScale;
        var adjustedMouseY = (d3.mouse(this)[1] - zoomTranslateY) / zoomScale;

        // insert a new node at mouse position
        var node = {
            id: ++lastNodeId,
            content: "",
            x: adjustedMouseX,
            y: adjustedMouseY,
            fixed: true
        };

        nodes.push(node);

      restart();

      console.log(nodes)
      console.log(node)
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

        // do getCurrentTransform operation here, not in the sync module

        container
          .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

        // fix mouse position offset by transform
        zoomTranslateX = d3.event.translate[0];
        zoomTranslateY = d3.event.translate[1];

        zoomScale = d3.event.scale;

    }

    function dragstart(d) {
      d3.select(this).classed("fixed", d.fixed = true);
    }

    function getCardContents() {

        var nodeCards = document.getElementsByClassName('card');

        for (var i = 0; i < nodeCards.length; i++) {
            nodeCards[i].value = nodes[i].content;
        }

    }

    // force starts here
    svg.on('mousedown', mousedown)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup)
      .on('contextmenu', newNode);


    restart();

    getCardContents();
}
