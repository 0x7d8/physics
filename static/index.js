const Engine = Matter.Engine,
	Render = Matter.Render,
	Runner = Matter.Runner,
	Bodies = Matter.Bodies,
	Composite = Matter.Composite,
	Mouse = Matter.Mouse,
	MouseConstraint = Matter.MouseConstraint

const engine = Engine.create()
const render = Render.create({
	element: document.getElementById('container'),
	bounds: {
		min: { x: 0, y: 0 },
		max: { x: window.innerWidth, y: window.innerHeight }
	}, options: {
		width: window.innerWidth,
		height: window.innerHeight,
		wireframes: false
	}, engine
})

/**
 * @type {Matter.Body[]} bodies
*/ const bodies = []

/**
 * Add a Body
 * @param {Matter.Body} body
 * @returns {void}
*/ function addBody(body) {
	bodies.push(body)
	Composite.add(engine.world, body)
}

/**
 * Remove a Body
 * @param {Matter.Body} body
 * @returns {void}
*/ function removeBody(body) {
	if (!bodies.includes(body)) return

	bodies.splice(bodies.indexOf(body), 1)
	Composite.remove(engine.world, body)
}

const mouse = Mouse.create(render.canvas),
	mouseConstraint = MouseConstraint.create(engine, {
		mouse,
		constraint: {
			stiffness: 0.2,
			render: {
				visible: false
			}
		}
	})

Composite.add(engine.world, mouseConstraint)

const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 25, 100000, 100, { isStatic: true })

window.addEventListener('resize', () => {
	render.options.width = window.innerWidth
	render.options.height = window.innerHeight
	render.canvas.width = window.innerWidth
	render.canvas.height = window.innerHeight
	render.bounds.max.x = window.innerWidth
	render.bounds.max.y = window.innerHeight

	ground.position.x = window.innerWidth / 2
	ground.position.y = window.innerHeight + 25
})

Composite.add(engine.world, ground)
Render.run(render);
(function run() {
	window.requestAnimationFrame(run)
	Engine.update(engine, 1000 / 60)

	for (const body of bodies) {
		if (body.position.y > window.innerHeight || body.position.x < 0 || body.position.x > window.innerWidth) {
			removeBody(body)
		}
	}
})()

function createBodyAtMouseUsingEvent(e) {
	const shape = document.getElementById('shape').value,
		mode = document.getElementById('mode').value,
		mass = parseFloat(document.getElementById('mass').value),
		size = parseFloat(document.getElementById('size').value)

	let body
	switch (shape) {
		case 'circle':
			body = Bodies.circle(e.clientX, e.clientY, size / 2)
			break

		case 'rectangle':
			body = Bodies.rectangle(e.clientX, e.clientY, size, size)
			break

		case 'triangle':
			body = Bodies.polygon(e.clientX, e.clientY, 3, size / 2)
			break

		default:
			return
	}

	body.label = JSON.stringify({ type: shape, size })

	if (mode === 'static') {
		body.render.fillStyle = 'red'
		body.isStatic = true
	} else {
		body.render.fillStyle = 'blue'
	}

	if (mass) {
		body.mass = mass
	}

	addBody(body)
}

// spawn body where the mouse is right clicked
document.addEventListener('contextmenu', e => {
	e.preventDefault()
	createBodyAtMouseUsingEvent(e)
})

// allow dragging the canvas to spawn a body
let isMouseDown = false
document.addEventListener('mousedown', () => isMouseDown = true)
document.addEventListener('mouseup', () => isMouseDown = false)
document.addEventListener('mousemove', e => {
	if (isMouseDown) {
		createBodyAtMouseUsingEvent(e)
	}
})

function clearBodies() {
	for (const body of bodies) {
		removeBody(body)
	}
}

function exportJson() {
	const json = JSON.stringify({
		bodies: bodies.map(body => ({
			...JSON.parse(body.label),
			position: body.position,
			velocity: body.velocity,
			mass: body.mass,
			isStatic: body.isStatic,
			render: {
				fillStyle: body.render.fillStyle
			}
		}))
	})

	const blob = new Blob([json], { type: 'application/json' }),
		url = URL.createObjectURL(blob)

	const a = document.createElement('a')
	a.href = url
	a.download = `bodies_${new Date().toISOString()}.json`
	a.click()
	URL.revokeObjectURL(url)
}

function importJson() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'application/json'
	input.addEventListener('change', async () => {
		const file = input.files[0],
			reader = new FileReader()

		reader.onload = () => {
			const json = JSON.parse(reader.result)

			let count = 0
			for (const body of json.bodies) {
				if (bodies.some(b => b.position.x === body.position.x && b.position.y === body.position.y)) {
					continue
				}

				count++

				let newBody
				switch (body.type) {
					case 'circle':
						newBody = Bodies.circle(body.position.x, body.position.y, body.size / 2)
						break

					case 'rectangle':
						newBody = Bodies.rectangle(body.position.x, body.position.y, body.size, body.size)
						break

					case 'triangle':
						newBody = Bodies.polygon(body.position.x, body.position.y, 3, body.size / 2)
						break

					default:
						continue
				}

				newBody.velocity = body.velocity
				newBody.mass = body.mass
				newBody.isStatic = body.isStatic
				newBody.render.fillStyle = body.render.fillStyle

				addBody(newBody)
			}

			alert(`Successfully imported ${count} bodies`)
		}

		reader.readAsText(file)
	})

	input.click()
}