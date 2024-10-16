export class AssetRegion {
    constructor(asset, x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.asset = asset;
    }

    update = () => {

    }

    draw = (context) => {
        context.beginPath();
        context.fillStyle = this.getFillColor();
        context.rect(this.x, this.y, this.size, this.size);
        context.closePath();
        context.fill();
    }

    getFillColor() {
        if (this.asset.contentType === 'javascript') {
            return 'green';
        }

        if (this.asset.contentType === 'css') {
            return 'brown';
        }

        if (this.asset.contentType === 'image') {
            return 'blue'
        }

        return 'red';
    }
}