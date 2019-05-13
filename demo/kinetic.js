const {
    StyledComponent,
} = Torus;

class DemoView extends StyledComponent {

    init() {
        this.xPosition = new AnimatedValue.Kinetic({
            start: 0,
            stiffness: 3,
            damping: .6,
        });
        this.yPosition = new AnimatedValue.Kinetic({
            start: 0,
            stiffness: 3,
            damping: .6,
        });

        this.handlePlayClick = this.handlePlayClick.bind(this);
    }

    styles() {
        return css`
        font-family: system-ui, sans-serif;
        max-width: 700px;
        margin: 24px auto;
        line-height: 1.5em;
        h1 {
            line-height: 1.5em;
        }
        .box {
            height: 100px;
            width: 100px;
            background: turquoise;
            box-shadow: 0 2px 6px -1px rgba(0, 0, 0, .3);
            border-radius: 4px;
        }
        button {
            padding: 4px 6px;
            font-size: 16px;
            border-radius: 4px;
            margin: 4px;
            background: #eee;
            cursor: pointer;
        }
        code {
            font-size: 1.3em;
            background: #eee;
            padding: 3px 6px;
            border-radius: 4px;
        }
        .playArea {
            width: 100%;
            height: 500px;
            background: #eee;
            position: relative;
            .box {
                position: absolute;
                top: 0;
                left: 0;
            }
        }
        `;
    }

    handlePlayClick(evt) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const rect = this.node.querySelector('.playArea').getBoundingClientRect();
                this.xPosition.playTo(evt.clientX - rect.left - 50);
                this.yPosition.playTo(evt.clientY - rect.top - 50, () => this.render()).then(result => {
                    console.log(`Animation resolved, returned ${result}`);
                });
            });
        });
    }

    compose() {
        return jdom`<main>
            <h1><code>animated-value</code> physics-based animations demo</h1>

            <p>This is a simple demo of the <a href="https://github.com/thesephist/animated-value">animated-value</a> JavaScript library for rendering imperative animations in declarative UI frameworks. This demo is built with a UI framework called <a href="https://github.com/thesephist/torus">Torus</a>, but you can also use the library with most other declarative, component-based UI frameworks with class components.</p>

            <p>
                In this demo, we're animating the X and Y positions of the box to where you click within the grey box, using the kinetic animated values capabilities of the library.
                You can read the source code behind this demo
                <a href="https://github.com/thesephist/animated-value/blob/master/demo/physics.js">here.</a>
            </p>

            <div class="playArea" onclick="${this.handlePlayClick}">
                <div class="box" style="
                    transform: translate(${this.xPosition.value()}px, ${this.yPosition.value()}px);
                "></div>
            </div>
        </main>`;
    }

}

const demoView = new DemoView();
document.body.appendChild(demoView.node);
