/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */




/**
 * A WebGLBatch Enables a group of sprites to be drawn using the same settings.
 * if a group of sprites all have the same baseTexture and blendMode then they can be grouped into a batch. All the sprites in a batch can then be drawn in one go by the GPU which is hugely efficient. ALL sprites in the webGL renderer are added to a batch even if the batch only contains one sprite. Batching is handled automatically by the webGL renderer. A good tip is: the smaller the number of batchs there are, the faster the webGL renderer will run. 
 * @class WebGLBatch
 * @param an instance of the webGL context
 * @return {PIXI.renderers.WebGLBatch} WebGLBatch {@link PIXI.renderers.WebGLBatch}
 */
PIXI.WebGLRenderGroup = function(gl)
{
	this.gl = gl;
	this.root;
	
	this.backgroundColor;
	this.batchs = [];
	this.toRemove = [];
}


// constructor
PIXI.WebGLRenderGroup.constructor = PIXI.WebGLRenderGroup;

PIXI.WebGLRenderGroup.prototype.setRenderable = function(displayObject)
{
	// has this changed??
	if(this.root)this.removeDisplayObjectAndChildren(this.root);
	
	displayObject.worldVisible = displayObject.visible;
	
	// soooooo //
	// to check if any batchs exist already??
	
	// TODO what if its already has an object? should remove it
	this.root = displayObject;
	//displayObject.__renderGroup = this;
	this.addDisplayObjectAndChildren(displayObject);
	//displayObject
}

PIXI.WebGLRenderGroup.prototype.render = function(projectionMatrix, renderer)
{
	
	renderer.updateTextures();
	
	var gl = this.gl;
	
	// set the flipped matrix..
	gl.uniformMatrix4fv(PIXI.shaderProgram.mvMatrixUniform, false, projectionMatrix);
	
	// TODO remove this by replacing visible with getter setters..	
	this.checkVisibility(this.root, this.root.visible);
	
	// will render all the elements in the group
	var renderable;
	
	
	for (var i=0; i < this.batchs.length; i++) 
	{
		renderable = this.batchs[i];
		if(renderable instanceof PIXI.WebGLBatch)
		{
			this.batchs[i].render();
		}
		else if(renderable instanceof PIXI.TilingSprite)
		{
			if(renderable.visible)this.renderTilingSprite(renderable, projectionMatrix);
		}
		else if(renderable instanceof PIXI.Strip)
		{
			if(renderable.visible)this.renderStrip(renderable, projectionMatrix);
		}
	}
	
}

PIXI.WebGLRenderGroup.prototype.renderSpecific = function(displayObject, projectionMatrix, renderer)
{
	renderer.updateTextures();
	
	var gl = this.gl;
	this.checkVisibility(displayObject, displayObject.visible);
	gl.uniformMatrix4fv(PIXI.shaderProgram.mvMatrixUniform, false, projectionMatrix);
	
	
	//console.log("SPECIFIC");
	// to do!
	// render part of the scene...
	
	var startIndex;
	var startBatchIndex;
	
	var endIndex;
	var endBatchIndex;
	
	// get NEXT Renderable!
	var nextRenderable = displayObject.renderable ? displayObject : this.getNextRenderable(displayObject);
	var startBatch = nextRenderable.batch;
	
	if(nextRenderable instanceof PIXI.Sprite)
	{
		startBatch = nextRenderable.batch;
		
		var head = startBatch.head;
		var next = head;
		
		// ok now we have the batch.. need to find the start index!
		if(head == nextRenderable)
		{
			startIndex = 0;
		}
		else
		{
			startIndex = 1;
			
			while(head.__next != nextRenderable)
			{
				startIndex++;
				head = head.__next;
			}
		}
	}
	else
	{
		startBatch = nextRenderable;
	}
	
	// Get the LAST renderable object
	var lastRenderable = displayObject;
	var endBatch;
	var lastItem = displayObject;
	while(lastItem.children.length > 0)
	{
		lastItem = lastItem.children[lastItem.children.length-1];
		if(lastItem.renderable)lastRenderable = lastItem;
	}
	
	if(lastRenderable instanceof PIXI.Sprite)
	{
		endBatch = lastRenderable.batch;
		
		var head = endBatch.head;
		
		if(head == lastRenderable)
		{
			endIndex = 0;
		}
		else
		{
			endIndex = 1;
			
			while(head.__next != lastRenderable)
			{
				endIndex++;
				head = head.__next;
			}
		}
	}
	else
	{
		endBatch = lastRenderable;
	}
	
	// TODO - need to fold this up a bit!
	
	
	if(startBatch == endBatch)
	{
		if(startBatch instanceof PIXI.WebGLBatch)
		{
			startBatch.render(startIndex, endIndex+1);
		}
		else if(startBatch instanceof PIXI.TilingSprite)
		{
			if(startBatch.visible)this.renderTilingSprite(startBatch, projectionMatrix);
		}
		else if(startBatch instanceof PIXI.Strip)
		{
			if(startBatch.visible)this.renderStrip(startBatch, projectionMatrix);
		}
		else if(startBatch instanceof PIXI.CustomRenderable)
		{
			if(startBatch.visible) startBatch.renderWebGL(this, projectionMatrix);
		}
		
		return;
	}
	
	// now we have first and last!
	startBatchIndex = this.batchs.indexOf(startBatch);
	endBatchIndex = this.batchs.indexOf(endBatch);
	
	// DO the first batch
	if(startBatch instanceof PIXI.WebGLBatch)
	{
		startBatch.render(startIndex);
	}
	else if(startBatch instanceof PIXI.TilingSprite)
	{
		if(startBatch.visible)this.renderTilingSprite(startBatch, projectionMatrix);
	}
	else if(startBatch instanceof PIXI.Strip)
	{
		if(startBatch.visible)this.renderStrip(startBatch, projectionMatrix);
	}
	else if(startBatch instanceof PIXI.CustomRenderable)
	{
		if(startBatch.visible) startBatch.renderWebGL(this, projectionMatrix);
	}
	
	// DO the middle batchs..
	for (var i=startBatchIndex+1; i < endBatchIndex; i++) 
	{
		renderable = this.batchs[i];
	
		if(renderable instanceof PIXI.WebGLBatch)
		{
			this.batchs[i].render();
		}
		else if(renderable instanceof PIXI.TilingSprite)
		{
			if(renderable.visible)this.renderTilingSprite(renderable, projectionMatrix);
		}
		else if(renderable instanceof PIXI.Strip)
		{
			if(renderable.visible)this.renderStrip(renderable, projectionMatrix);
		}
		else if(renderable instanceof PIXI.CustomRenderable)
		{
			if(renderable.visible) renderable.renderWebGL(this, projectionMatrix);
		}
		
	}
	
	// DO the last batch..
	if(endBatch instanceof PIXI.WebGLBatch)
	{
		endBatch.render(0, endIndex+1);
	}
	else if(endBatch instanceof PIXI.TilingSprite)
	{
		if(endBatch.visible)this.renderTilingSprite(endBatch);
	}
	else if(endBatch instanceof PIXI.Strip)
	{
		if(endBatch.visible)this.renderStrip(endBatch);
	}
	else if(endBatch instanceof PIXI.CustomRenderable)
	{
		if(endBatch.visible) endBatch.renderWebGL(this, projectionMatrix);
	}
}

PIXI.WebGLRenderGroup.prototype.checkVisibility = function(displayObject, globalVisible)
{
	// give the dp a refference to its renderGroup...
	var children = displayObject.children;
	//displayObject.worldVisible = globalVisible;
	for (var i=0; i < children.length; i++) 
	{
		var child = children[i];
		
		// TODO optimize... shouldt need to loop through everything all the time
		child.worldVisible = child.visible && globalVisible;
		
		// everything should have a batch!
		// time to see whats new!
		if(child.textureChange)
		{
			child.textureChange = false;
			if(child.worldVisible)
			{
				this.removeDisplayObject(child);
				this.addDisplayObject(child);
				//this.updateTexture(child);
			}
			// update texture!!
		}
		
		if(child.children.length > 0)
		{
			this.checkVisibility(child, child.worldVisible);
		}
	};
}

PIXI.WebGLRenderGroup.prototype.updateTexture = function(displayObject)
{
	// we know this exists..
	// is it in a batch..
	// check batch length
	if(displayObject.batch.length == 1)
	{
		// just one! this guy! so simply swap the texture
		displayObject.batch.texture = displayObject.texture.baseTexture;
		return;
	}
	
	// early out!
	if(displayObject.batch.texture == displayObject.texture.baseTexture)return;
	
	
	if(displayObject.batch.head == displayObject)
	{
		//console.log("HEAD")
		var currentBatch = displayObject.batch;
		
		var index = this.batchs.indexOf( currentBatch );
		var previousBatch =  this.batchs[index-1];
		currentBatch.remove(displayObject);
		
		if(previousBatch)
		{
			if(previousBatch.texture == displayObject.texture.baseTexture && previousBatch.blendMode == displayObject.blendMode)
			{
				previousBatch.insertAfter(displayObject, previousBatch.tail);
			}
			else
			{
				// add it before..
				var batch = PIXI.WebGLRenderer.getBatch();
				batch.init(displayObject);
				this.batchs.splice(index-1, 0, batch);
			}
			
		}
		else
		{
			// we are 0!
			var batch = PIXI.WebGLRenderer.getBatch();
			batch.init(displayObject);
			this.batchs.splice(0, 0, batch);
		}
		
	}
	else if(displayObject.batch.tail == displayObject)
	{
		var currentBatch = displayObject.batch;
		
		var index = this.batchs.indexOf( currentBatch );
		var nextBatch =  this.batchs[index+1];
		currentBatch.remove(displayObject);
		
		if(nextBatch)
		{
			if(nextBatch.texture == displayObject.texture.baseTexture && nextBatch.blendMode == displayObject.blendMode)
			{
				nextBatch.insertBefore(displayObject, nextBatch.head);
				return;
			}
			else
			{
				// add it before..
				var batch = PIXI.WebGLRenderer.getBatch();
				batch.init(displayObject);
				this.batchs.splice(index+1, 0, batch);
			}
			
		}
		else
		{
			// we are 0!
			var batch = PIXI.WebGLRenderer.getBatch();
			batch.init(displayObject);
			this.batchs.push(batch);
		}
	}
	else
	{
	//	console.log("MIDDLE")
		var currentBatch = displayObject.batch;
		
		// split the batch into 2
		// AH! dont split on the current display object as the texture is wrong!
		var splitBatch = currentBatch.split(displayObject);
		
		// now remove the display object
		splitBatch.remove(displayObject);
		
		var batch = PIXI.WebGLRenderer.getBatch();
		var index = this.batchs.indexOf( currentBatch );
		batch.init(displayObject);
		this.batchs.splice(index+1, 0, batch, splitBatch);
	}
}

PIXI.WebGLRenderGroup.prototype.addDisplayObject = function(displayObject)
{
	// add a child to the render group..
	if(displayObject.__renderGroup)displayObject.__renderGroup.removeDisplayObjectAndChildren(displayObject);

	// DONT htink this is needed?
	//	displayObject.batch = null;
	
	displayObject.__renderGroup = this;

	//displayObject.cacheVisible = true;
	if(!displayObject.renderable)return;

	// while looping below THE OBJECT MAY NOT HAVE BEEN ADDED
	//displayObject.__inWebGL = true;
	
	var previousSprite = this.getPreviousRenderable(displayObject);
	var nextSprite = this.getNextRenderable(displayObject);
	

	/*
	 * so now we have the next renderable and the previous renderable
	 * 
	 */
	
	if(displayObject instanceof PIXI.Sprite)
	{
		var previousBatch
		var nextBatch
		
		//console.log( previousSprite)
		if(previousSprite instanceof PIXI.Sprite)
		{
			previousBatch = previousSprite.batch;
			if(previousBatch)
			{
				if(previousBatch.texture == displayObject.texture.baseTexture && previousBatch.blendMode == displayObject.blendMode)
				{
					previousBatch.insertAfter(displayObject, previousSprite);
					return;
				}
			}
		}
		else
		{
			// TODO reword!
			previousBatch = previousSprite;
		}
	
		if(nextSprite)
		{
			if(nextSprite instanceof PIXI.Sprite)
			{
				nextBatch = nextSprite.batch;
			
				//batch may not exist if item was added to the display list but not to the webGL
				if(nextBatch)
				{
					if(nextBatch.texture == displayObject.texture.baseTexture && nextBatch.blendMode == displayObject.blendMode)
					{
						nextBatch.insertBefore(displayObject, nextSprite);
						return;
					}
					else
					{
						if(nextBatch == previousBatch)
						{
							// THERE IS A SPLIT IN THIS BATCH! //
							var splitBatch = previousBatch.split(nextSprite);
							// COOL!
							// add it back into the array	
							/*
							 * OOPS!
							 * seems the new sprite is in the middle of a batch
							 * lets split it.. 
							 */
							var batch = PIXI.WebGLRenderer.getBatch();

							var index = this.batchs.indexOf( previousBatch );
							batch.init(displayObject);
							this.batchs.splice(index+1, 0, batch, splitBatch);
							
							return;
						}
					}
				}
			}
			else
			{
				// TODO re-word!
				nextBatch = nextSprite;
			}
		}
		
		/*
		 * looks like it does not belong to any batch!
		 * but is also not intersecting one..
		 * time to create anew one!
		 */
		
		var batch =  PIXI.WebGLRenderer.getBatch();
		batch.init(displayObject);

		if(previousBatch) // if this is invalid it means 
		{
			var index = this.batchs.indexOf( previousBatch );
			this.batchs.splice(index+1, 0, batch);
		}
		else
		{
			this.batchs.push(batch);
		}
	
	}
	else if(displayObject instanceof PIXI.TilingSprite)
	{
		// add to a batch!!
		this.initTilingSprite(displayObject);
		this.batchs.push(displayObject);
		
	}
	else if(displayObject instanceof PIXI.Strip)
	{
		// add to a batch!!
		this.initStrip(displayObject);
		this.batchs.push(displayObject);
	}
	
	// if its somthing else... then custom codes!
	this.batchUpdate = true;
}

PIXI.WebGLRenderGroup.prototype.addDisplayObjectAndChildren = function(displayObject)
{
	// TODO - this can be faster - but not as important right now
	
	this.addDisplayObject(displayObject);
	var children = displayObject.children;
	
	for (var i=0; i < children.length; i++) 
	{
	  	this.addDisplayObjectAndChildren(children[i]);
	};
}

PIXI.WebGLRenderGroup.prototype.removeDisplayObject = function(displayObject)
{
	// loop through children..
	// display object //
	
	// add a child from the render group..
	// remove it and all its children!
	//displayObject.cacheVisible = false;//displayObject.visible;
	displayObject.__renderGroup = null;
	
	if(!displayObject.renderable)return;
	
	/*
	 * removing is a lot quicker..
	 * 
	 */
	var batchToRemove;
	
	if(displayObject instanceof PIXI.Sprite)
	{
		// should always have a batch!
		var batch = displayObject.batch;
		if(!batch)return; // this means the display list has been altered befre rendering
		
		batch.remove(displayObject);
		
		if(batch.size==0)
		{
			batchToRemove = batch;
		}
	}
	else
	{
		batchToRemove = displayObject;
	}
	
	/*
	 * Looks like there is somthing that needs removing!
	 */
	if(batchToRemove)	
	{
		var index = this.batchs.indexOf( batchToRemove );
		if(index == -1)return;// this means it was added then removed before rendered
		
		// ok so.. check to see if you adjacent batchs should be joined.
		// TODO may optimise?
		if(index == 0 || index == this.batchs.length-1)
		{
			// wha - eva! just get of the empty batch!
			this.batchs.splice(index, 1);
			if(batchToRemove instanceof PIXI.WebGLBatch)PIXI.WebGLRenderer.returnBatch(batchToRemove);
		
			return;
		}
		
		if(this.batchs[index-1] instanceof PIXI.WebGLBatch && this.batchs[index+1] instanceof PIXI.WebGLBatch)
		{
			if(this.batchs[index-1].texture == this.batchs[index+1].texture && this.batchs[index-1].blendMode == this.batchs[index+1].blendMode)
			{
				//console.log("MERGE")
				this.batchs[index-1].merge(this.batchs[index+1]);
				
				if(batchToRemove instanceof PIXI.WebGLBatch)PIXI.WebGLRenderer.returnBatch(batchToRemove);
				PIXI.WebGLRenderer.returnBatch(this.batchs[index+1]);
				this.batchs.splice(index, 2);
				return;
			}
		}
		
		
		this.batchs.splice(index, 1);
		if(batchToRemove instanceof PIXI.WebGLBatch)PIXI.WebGLRenderer.returnBatch(batchToRemove);
	}
}

PIXI.WebGLRenderGroup.prototype.removeDisplayObjectAndChildren = function(displayObject)
{
	// TODO - this can be faster - but not as important right now
	if(displayObject.__renderGroup != this)return;
	
	this.removeDisplayObject(displayObject);
	var children = displayObject.children;
	
	for (var i=0; i < children.length; i++) 
	{
	  	this.removeDisplayObjectAndChildren(children[i]);
	};
}

/**
 * @private
 */

PIXI.WebGLRenderGroup.prototype.getNextRenderable = function(displayObject)
{
	/*
	 *  LOOK FOR THE NEXT SPRITE
	 *  This part looks for the closest next sprite that can go into a batch
	 *  it keeps looking until it finds a sprite or gets to the end of the display
	 *  scene graph
	 * 
	 *  These look a lot scarier than the actually are...
	 */
	
	var nextSprite = displayObject;
	do
	{
		// moving forward!
		// if it has no children.. 
		if(nextSprite.children.length == 0)
		{
			//maynot have a parent
			if(!nextSprite.parent)return null;
			
			// go along to the parent..
			while(nextSprite.childIndex == nextSprite.parent.children.length-1)
			{
				nextSprite = nextSprite.parent;
				//console.log(">" + nextSprite);
//				console.log(">-" + this.root);
				if(nextSprite ==  this.root || !nextSprite.parent)//displayObject.stage)
				{
					nextSprite = null
					break;
				}
			}
			
			if(nextSprite)nextSprite = nextSprite.parent.children[nextSprite.childIndex+1];
		}
		else
		{
			nextSprite = nextSprite.children[0];
		}

		if(!nextSprite)break;
	}
	while(!nextSprite.renderable || !nextSprite.__renderGroup)
	
	return nextSprite;
}

PIXI.WebGLRenderGroup.prototype.getPreviousRenderable = function(displayObject)
{
	/*
	 *  LOOK FOR THE PREVIOUS SPRITE
	 *  This part looks for the closest previous sprite that can go into a batch
	 *  It keeps going back until it finds a sprite or the stage
	 */
	var previousSprite = displayObject;
	do
	{
		if(previousSprite.childIndex == 0)
		{
			previousSprite = previousSprite.parent;
			if(!previousSprite)return null;
		}
		else
		{
			
			previousSprite = previousSprite.parent.children[previousSprite.childIndex-1];
			// what if the bloop has children???
			while(previousSprite.children.length != 0)
			{
				// keep diggin till we get to the last child
				previousSprite = previousSprite.children[previousSprite.children.length-1];
			}
		}
		
		if(previousSprite == this.root)break;
	}
	while(!previousSprite.renderable || !previousSprite.__renderGroup);
	
	return previousSprite;
}

/**
 * @private
 */
PIXI.WebGLRenderGroup.prototype.initTilingSprite = function(sprite)
{
	var gl = this.gl;

	// make the texture tilable..
			
	sprite.verticies = new Float32Array([0, 0,
										  sprite.width, 0,
										  sprite.width,  sprite.height,
										 0,  sprite.height]);
					
	sprite.uvs = new Float32Array([0, 0,
									1, 0,
									1, 1,
									0, 1]);
				
	sprite.colors = new Float32Array([1,1,1,1]);
	
	sprite.indices =  new Uint16Array([0, 1, 3,2])//, 2]);
	
	
	sprite._vertexBuffer = gl.createBuffer();
	sprite._indexBuffer = gl.createBuffer();
	sprite._uvBuffer = gl.createBuffer();
	sprite._colorBuffer = gl.createBuffer();
						
	gl.bindBuffer(gl.ARRAY_BUFFER, sprite._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, sprite.verticies, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, sprite._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  sprite.uvs, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, sprite._colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, sprite.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sprite._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sprite.indices, gl.STATIC_DRAW);
    
//    return ( (x > 0) && ((x & (x - 1)) == 0) );

	if(sprite.texture.baseTexture._glTexture)
	{
    	gl.bindTexture(gl.TEXTURE_2D, sprite.texture.baseTexture._glTexture);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		sprite.texture.baseTexture._powerOf2 = true;
	}
	else
	{
		sprite.texture.baseTexture._powerOf2 = true;
	}
}

/**
 * @private
 */
PIXI.WebGLRenderGroup.prototype.renderStrip = function(strip, projectionMatrix)
{
	var gl = this.gl;
	var shaderProgram = PIXI.shaderProgram;
//	mat
	var mat4Real = PIXI.mat3.toMat4(strip.worldTransform);
	PIXI.mat4.transpose(mat4Real);
	PIXI.mat4.multiply(projectionMatrix, mat4Real, mat4Real )

	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mat4Real);
  
	if(strip.blendMode == PIXI.blendModes.NORMAL)
	{
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	}
	else
	{
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
	}
	
	if(!strip.dirty)
	{
		
		gl.bindBuffer(gl.ARRAY_BUFFER, strip._vertexBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, strip.verticies)
	    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
		
		// update the uvs
	   	gl.bindBuffer(gl.ARRAY_BUFFER, strip._uvBuffer);
	    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
			
	    gl.activeTexture(gl.TEXTURE0);
	    gl.bindTexture(gl.TEXTURE_2D, strip.texture.baseTexture._glTexture);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, strip._colorBuffer);
	    gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, 0, 0);
		
		// dont need to upload!
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, strip._indexBuffer);
    
	
	}
	else
	{
		strip.dirty = false;
		gl.bindBuffer(gl.ARRAY_BUFFER, strip._vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, strip.verticies, gl.STATIC_DRAW)
	    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
		
		// update the uvs
	   	gl.bindBuffer(gl.ARRAY_BUFFER, strip._uvBuffer);
	   	gl.bufferData(gl.ARRAY_BUFFER, strip.uvs, gl.STATIC_DRAW)
	    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
			
	    gl.activeTexture(gl.TEXTURE0);
	    gl.bindTexture(gl.TEXTURE_2D, strip.texture.baseTexture._glTexture);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, strip._colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, strip.colors, gl.STATIC_DRAW)
	    gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, 0, 0);
		
		// dont need to upload!
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, strip._indexBuffer);
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, strip.indices, gl.STATIC_DRAW);
	    
	}
	//console.log(gl.TRIANGLE_STRIP)
	gl.drawElements(gl.TRIANGLE_STRIP, strip.indices.length, gl.UNSIGNED_SHORT, 0);
    
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, projectionMatrix);
  
}


/**
 * @private
 */
PIXI.WebGLRenderGroup.prototype.renderTilingSprite = function(sprite, projectionMatrix)
{
	var gl = this.gl;
	var shaderProgram = PIXI.shaderProgram;
	
	var tilePosition = sprite.tilePosition;
	var tileScale = sprite.tileScale;
	
	var offsetX =  tilePosition.x/sprite.texture.baseTexture.width;
	var offsetY =  tilePosition.y/sprite.texture.baseTexture.height;
	
	var scaleX =  (sprite.width / sprite.texture.baseTexture.width)  / tileScale.x;
	var scaleY =  (sprite.height / sprite.texture.baseTexture.height) / tileScale.y;

	sprite.uvs[0] = 0 - offsetX;
	sprite.uvs[1] = 0 - offsetY;
	
	sprite.uvs[2] = (1 * scaleX)  -offsetX;
	sprite.uvs[3] = 0 - offsetY;
	
	sprite.uvs[4] = (1 *scaleX) - offsetX;
	sprite.uvs[5] = (1 *scaleY) - offsetY;
	
	sprite.uvs[6] = 0 - offsetX;
	sprite.uvs[7] = (1 *scaleY) - offsetY;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, sprite._uvBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprite.uvs)
	
	this.renderStrip(sprite, projectionMatrix);
}



/**
 * @private
 */
PIXI.WebGLRenderGroup.prototype.initStrip = function(strip)
{
	// build the strip!
	var gl = this.gl;
	var shaderProgram = this.shaderProgram;
	
	strip._vertexBuffer = gl.createBuffer();
	strip._indexBuffer = gl.createBuffer();
	strip._uvBuffer = gl.createBuffer();
	strip._colorBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, strip._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, strip.verticies, gl.DYNAMIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, strip._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  strip.uvs, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, strip._colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, strip.colors, gl.STATIC_DRAW);

	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, strip._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, strip.indices, gl.STATIC_DRAW);
}

