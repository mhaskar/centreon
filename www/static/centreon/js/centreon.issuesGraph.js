/* global jQuery:false */
/**
 * Draw a issues graph
 */
(function( $ ) {
  function CentreonIssuesGraph( settings, $elem ) {
    var thisObj = this;
    this.settings = settings;
    this.$elem = $elem;
    this.$currentIssue = undefined;
    this.issues = {};
    this.thumbsHeight = 0;
    /* Initialize jsPlumb defaults */
    this.jsPlumbInstance = jsPlumb.getInstance({
      Endpoint: this.settings.endPointForm,
      EndpointStyle: {
        fillStyle: this.settings.endPointColor,
        radius: this.settings.endPointSize
      },
      PaintStyle: {
        lineWidth: this.settings.paintStyleSize,
        strokeStyle: this.settings.paintStyleColor
      },
      Container: $( ".graph" )
    });

    /* Attach events */
    this.$elem.on( "click", ".expand", function( e ) {
      var $elem = $( e.currentTarget ).parents( ".service-box" );
      if ( $elem.length == 1 ) {
        thisObj.toggleExtexded( $( $elem[0] ), $( e.currentTarget ) );
      }
    });
    this.$elem.on( "click", ".parent-link", function( e ) {
      var childId, data,
          $elem = $( e.currentTarget );
      data = $elem.data( "centreonIssuesGraph" );
      $elem.tooltip( "hide" );
      thisObj.moveTo( data.id );
    });
    this.$elem.on( "click", ".children-link", function( e ) {
      var childId,
          $elem = $( e.currentTarget );
      if ( $elem.attr( "id" ) ) {
        childId = $elem.attr( "id" ).split( "_" )[1];
      } else {
        childId = $elem.parent( "children-link" ).attr( "id" ).split( "_" )[1];
      }
      thisObj.moveTo( childId );
    });

    return this;
  }

  CentreonIssuesGraph.prototype = {
    drawIssue: function( issue ) {
      var $issueBox, $content,
          $header = $( "<div></div>" ).addClass( "panel-heading" ).text( issue.name );

      /* Create content */
      $content = $( "<div></div>" )
        .addClass( "panel-body" )
        .append(
          $( "<div></div>" ).addClass( "pull-right" ).addClass( "last-update" ).text( "Since : " + issue.last_update )
        )
        .append(
          $( "<i></i>" ).addClass( "expand" ).addClass( "fa" ).addClass( "fa-plus-circle" )
        )
        .append(
          $( "<div></div>" ).addClass( "output" ).html( issue.output )
        )
        .append(
          $( "<div></div>" ).addClass( "row" ).addClass( "extended-info" ).css( "display",  "none" )
        );

      $issueBox = $( "<div></div>")
        .attr( "id", "issue_" + issue.id )
        .addClass( "panel" )
        .addClass( issue.status )
        .addClass( "service-box" )
        .append( $header )
        .append( $content );
      return $issueBox;
    },
    loadIssue: function( issueId ) {
      var thisObj = this;
      $.ajax( {
        url: this.settings.urlGetInfo,
        dataType: "json",
        type: "POST",
        data: {
          action: "get_info",
          issue_id: issueId
        },
        success: function( data, textStatus, jqXHR ) {
          var $issueParent, dataParent;
          if ( $( "#issue_" + issueId).length === 0 ) {
            $issueParent = thisObj.drawIssue( data ).appendTo( thisObj.$elem );
          } else {
            $issueParent = $( $( "#issue_" + issueId)[0] );
          }
          dataParent = $issueParent.data( "centreonIssuesGraph" );
          if ( !dataParent ) {
            dataParent = {
              loaded: false,
              children: [],
              has_parent: false,
              has_children: false,
              parents: undefined
            };
          }
          if ( data.has_parent && dataParent.parents === undefined ) {
            dataParent.has_parent = data.has_parent;
            dataParent.parents = data.parents;
          }
          if ( data.has_children && !dataParent.loaded ) {
            dataParent.has_children = true;
            $.ajax({
              url: thisObj.settings.urlGetInfo,
              dataType: "json",
              type: "POST",
              data: {
                action: "getChildren",
                issue_id: issueId
              },
              success: function( data, textStatus, jqXHR ) {
                $.each( data, function( idx, issue ) {
                  var $service;
                  if ( $( "#issue_" + issue.id ).length === 0 ) {
                    $service = thisObj.drawIssue( issue ).appendTo( thisObj.$elem );
                    $service.data( "centreonIssuesGraph", {
                      loaded: false,
                      children: [],
                      has_parent: true,
                      has_children: issue.has_children,
                      parents: undefined
                    } );
                  } else {
                    $service = $( $( "#issue_" + issue.id )[0] );
                  }
                  dataParent.children.push( $service );
                } );
                dataParent.loaded = true;
                $issueParent.data( "centreonIssuesGraph", dataParent );
                thisObj.$currentIssue = $issueParent;
                thisObj.drawGraph();
              }     
            });
          } else {
            dataParent.has_parent = data.has_parent;
            dataParent.loaded = true;
            $issueParent.data( "centreonIssuesGraph", dataParent );
            thisObj.$currentIssue = $issueParent;
            thisObj.drawGraph();
          }
        }
      } );
    },
    drawGraph: function() {
      var parentTopPos, epParent, parentLinkTopPos,
          epChildren = [],
          posTop = 0,
          thisObj = this,
          data = this.$currentIssue.data( "centreonIssuesGraph" );

      $( ".parent-link" ).remove();
      $( ".children-link" ).remove();

      /* Position children */
      $.each( data.children, function( idx, $issue ) {
        var dataChildren = $issue.data( "centreonIssuesGraph" );
        posTop += thisObj.settings.marginHeight;
        $issue
          .css( "top", posTop + "px")
          .css( "right", thisObj.settings.offset + "px" )
          .css( "left", "" )
          .removeClass( "service-box-parent" )
          .addClass( "service-box-child" );
        $issue.show();

        /* Add icon if has children */
        if ( dataChildren.has_children ) {
          $( "<div></div>" )
            .addClass( "children-link" )
            .attr( "id", "children_" + $issue.attr( "id" ).split( "_" )[1] )
            .append(
              $( "<i></i>" )
                .addClass( "fa" )
                .addClass( "fa-arrow-circle-right" )
            )
            .css( "right", (thisObj.settings.offset - 6) + "px" )
            .css( "top", posTop + $issue.height() / 2 )
            .appendTo( thisObj.$elem );
        }
        posTop += $issue.height();
      });

      /* Position parent */
      parentTopPos = posTop / 2 - this.$currentIssue.height() / 2;
      if ( parentTopPos <= 0 ) {
        parentTopPos = this.$elem.height() / 2 - this.$currentIssue.height() / 2;
      }
      this.$currentIssue
        .css( "top", parentTopPos + "px" )
        .css( "left", thisObj.settings.offset + "px" )
        .css( "right", "" )
        .removeClass( "service-box-child" )
        .addClass( "service-box-parent" );
      this.$currentIssue.show();

      /* Add icon if has parent */
      if ( data.has_parent ) {
        parentLinkTopPos = parentTopPos + ( this.$currentIssue.height() / 2 - data.parents.length * 20 / 2 );
        $.each( data.parents, function( idx, parent ) {
          $( "<div></div>" )
            .addClass( "parent-link" )
            .append(
              $( "<i></i>" )
                .addClass( "fa" )
                .addClass( "fa-arrow-circle-left" )
            )
            .css( "left", ( thisObj.settings.offset - 6 ) + "px" )
            .css( "top", parentLinkTopPos + "px" )
            .attr( "data-toggle", "tooltip" )
            .attr( "data-placement", "left" )
            .attr( "title", parent.name )
            .data( "centreonIssuesGraph", { "id": parent.id } )
            .appendTo( thisObj.$elem );
            parentLinkTopPos += 20;
        });
        $( ".parent-link" ).tooltip();
      }

      /* Add links */
      $.each( data.children, function( idx, $issue ) {
        thisObj.jsPlumbInstance.connect({
          source: thisObj.$currentIssue,
          target: $issue,
          anchors: [ "RightMiddle", "LeftMiddle" ]
        });
      });
    },
    toggleExtexded: function( $elem, $button ) {
      var fullsize,
          thisObj = this,
          id = $elem.attr( "id" ).split( "_" )[ 1 ];
      if ( $button.hasClass( "fa-plus-circle" ) ) {
        $button.removeClass( "fa-plus-circle" ).addClass( "fa-minus-circle" );
        
        $.ajax({
          url: this.settings.urlGetInfo,
          dataType: "json",
          type: "POST",
          data: {
            action: "get_extended_info",
            issue_id: id
          },
          success: function( data, textStatus, jqXHR ) {
            var fullsize,
                $extInfo = $elem.find( ".extended-info" );
            $extInfo
              .append(
                $( "<div></div>")
                  .append( $( "<hr>") )
                  .addClass( "col-md-12" )
              )
              .append( 
                $( "<div></div>" )
                  .addClass( "col-md-8" )
                  .html( data.extended_text )
              )
              .append(
                $( "<div></div>" )
                  .attr( "id", "chart-" + id )
                  .addClass( "col-md-4" )
                  .addClass( ".chart-uptime" )
              );
            $extInfo.show();
            c3.generate({
              bindto: "#chart-" + id,
              size: {
                height: 100,
                width: 100
              },
              legend: {
                show: false
              },
              data: {
                type: "pie",
                columns: data.status
              }
            });
            /* Resize */
            fullsize = $elem.find( ".panel-heading" ).height() + $elem.find( ".panel-body" ).height() + 15;
            if ( $elem.hasClass( "service-box-child" )) {
              $elem.nextAll( ".service-box" ).each( function( idx, elem ) {
                thisObj.moveArrow( elem, "+=" + ( fullsize - thisObj.settings.boxHeight ) );
                thisObj.jsPlumbInstance.animate( elem, {
                  top: "+=" + ( fullsize - thisObj.settings.boxHeight )
                });
              });
            }
            thisObj.moveArrow( $elem[0], "+=" + ( fullsize - thisObj.settings.boxHeight ) );
            thisObj.jsPlumbInstance.animate( $elem[0], { 
              height: fullsize
            });
          }
        });
      } else {
        $button.removeClass( "fa-minus-circle" ).addClass( "fa-plus-circle" );
        fullsize = $elem.find( ".panel-heading" ).height() + $elem.find( ".panel-body" ).height() + 15;
        $elem.find( ".extended-info" ).html( "" ).hide();
        this.moveArrow( $elem[0], "-=" + ( fullsize - this.settings.boxHeight ) );
        this.jsPlumbInstance.animate( $elem[0], { 
          height: this.settings.boxHeight
        });
        if ( $elem.hasClass( "service-box-child" )) {
          $elem.nextAll( ".service-box" ).each( function( idx, elem ) {
            thisObj.moveArrow( elem, "-=" + ( fullsize - thisObj.settings.boxHeight ) );
            thisObj.jsPlumbInstance.animate( elem, {
              top: "-=" + ( fullsize - thisObj.settings.boxHeight )
            });
          });
        }
      }
    },
    moveArrow: function( elem, animation ) {
      var id = $( elem ).attr( "id" ).split( "_" )[1];
      $( "#children_" + id ).animate({
        top: animation
      });
      $( "#parent_" + id ).animate({
        top: animation
      });
    },
    moveTo: function( issueId ) {
      var $issueElem = $( "#issue_" + issueId );
      $( ".parent-link" ).remove();
      $( ".children-link" ).remove();
      this.jsPlumbInstance.detachEveryConnection();
      $( ".service-box" ).not( $issueElem ).hide();
      this.loadIssue( issueId );
    },
    drawMinimap: function( issueId ) {
      var $elemMap,
        thisObj = this;
      $elemMap = $( "<div></div>" )
        .addClass( "issuesMinimap" )
        .append(
          $( "<div></div>" )
            .addClass( "issuesMinimap-body" )
        )
        .append(
          $( "<div></div>" )
            .append(
              $( "<div></div>" )
                .addClass( "pull-right" )
                .addClass( "issuesMinimap-button" )
                .html(
                  "<i class='fa fa-caret-down'></i> Minimap"
                )
            )
        );
      this.$elem.append( $elemMap );
      $.ajax({
        url: this.settings.urlGetInfo,
        dataType: "json",
        type: "POST",
        data: {
            action: "issue_tree",
            issue_id: issueId
        },
        success: function( data, textStatus, jqXHR ) {
          var miniInstance,
              posLeft = thisObj.settings.offset;
          $.each( data, function( idx, colList ) {
            var posTop = thisObj.settings.offset;
            $.each( colList, function( idx, issue ) {
              var $issueBox = $( "<div></div>" )
                .attr( "id", "issueThumb_" + issue.id )
                .attr( "data-toggle", "tooltip")
                .attr( "data-placement", "bottom")
                .attr( "title", issue.name )
                .addClass( "issue-thumb" )
                .addClass( issue.status )
                .css( "top", posTop )
                .css( "left", posLeft )
                .appendTo( $elemMap.find( ".issuesMinimap-body" ) );
              posTop += 25 + thisObj.settings.offset;
            });
            if ( posTop > thisObj.thumbsHeight ) {
              thisObj.thumbsHeight = posTop;
            }
            posLeft += 50 + thisObj.settings.offset * 2;
          });
          $( ".issue-thumb" ).tooltip();
          /* Init instance of jsPlumb */
          miniInstance = jsPlumb.getInstance({
            Endpoint: thisObj.settings.endPointForm,
            EndpointStyle: {
              fillStyle: thisObj.settings.endPointColor,
              radius: 4
            },
            PaintStyle: {
              lineWidth: 2,
              strokeStyle: thisObj.settings.paintStyleColor
            },
            Connector:[ "Bezier", { curviness: 10 } ]
          });
          $.each( data, function( idx, colList ) {
            $.each( colList, function( idx, issue ) {
              $.each( issue.children, function( idx, child ) {
                miniInstance.connect({
                  source: $( "#issueThumb_" + issue.id )[0],
                  target: $( "#issueThumb_" + child )[0],
                  anchors: [ "RightMiddle", "LeftMiddle" ]
                });
              });
            });
          });
        }
      });
    }
  };

  /* jQuery method */
  $.fn.centreonIssuesGraph = function( options ) {
    var $set, methodReturn,
        args = Array.prototype.slice.call( arguments, 1 ),
        settings = $.extend( {}, $.fn.centreonIssuesGraph.defaults, options );

    $set = this.each( function() {
      var $this = $( this ),
          data = $this.data( "centreonIssuesGraph" );

      if ( !data ) {
        $this.data( "centreonIssuesGraph", ( data = new CentreonIssuesGraph( settings, $this ) ) );
      }
      if ( typeof options === "string" ) {
        methodReturn = data[ options ].apply( data, args );
      }

      return ( methodReturn === undefined ) ? $set : methodReturn;
    });
  };

  /* Default values */
  $.fn.centreonIssuesGraph.defaults = {
    offset: 20,
    marginHeight: 30,
    boxHeight: 160,
    endPointForm: "Dot",
    endPointColor: "#456",
    endPointSize: 6,
    paintStyleSize: 3,
    paintStyleColor: "#456",
    drawMinimap: false,
    urlGetInfo: ""
  };
})( jQuery );
