import { getTextAsLines, resetContextScope } from '../helpers.js';

export class PlanetInfoPane {
    constructor(x, y, height, width, info) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.info = info;
    }

    draw = (context) => {
		resetContextScope(context, () => {
			context.beginPath();
            context.fillStyle = `rgba(3, 190, 252, .15`;
			context.rect(this.x, this.y, this.width, this.height);
			context.closePath();
			context.fill();
            this.drawText(context);
		});
	}

    drawText(context) {
        if (this.info?.type === 'assets') {
            this.drawAssetInfo(context);
        } else if (this.info?.type === 'css') {
            this.drawCssInfo(context);
        } else if (this.info?.type === 'image') {
            this.drawImageInfo(context);
        } else if (this.info?.type === 'html') {
            this.drawHtmlInfo(context);
        }
    }

    drawAssetInfo(context) {
        this.setHeadingFont(context);
        context.fillText('Page Assets', this.x + (this.width / 2), this.y + 24);
        context.fillText(`Images: ${this.info.image.total}, size: ${this.bytesToDisplay(this.info.image.bytes)}`, this.x + (this.width / 2), this.y + 48 + 12);
        context.fillText(`CSS: ${this.info.css.total}, size: ${this.bytesToDisplay(this.info.css.bytes)}`, this.x + (this.width / 2), this.y + 72 + 12);
        context.fillText(`Javascript: ${this.info.javascript.total}, size: ${this.bytesToDisplay(this.info.javascript.bytes)}`, this.x + (this.width / 2), this.y + 96 + 12);
    }

    drawCssInfo(context) {
        let verticalPadding = 12;
        let lineHeight = 24;
        let currentLine = 1;
        this.setHeadingFont(context);
        context.fillText('CSS Details', this.x + (this.width / 2), this.y + lineHeight);
        const urlLines = getTextAsLines(context, `URL: ${this.info.url}`, this.width, 4);
        urlLines.forEach(line => {
            context.fillText(line, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        });
        context.fillText(`Size: ${this.bytesToDisplay(this.info.bytes)}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        context.fillText(`Total classes: ${this.info.totalClasses}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        context.fillText(`Total Ids: ${this.info.totalIds}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);

        if (this.info.links < 1) {
            return;
        }

        context.fillText('Referenced URLs:', this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        this.setSubHeadingFont(context);
        let baseHeightOffset = lineHeight * ++currentLine;
        verticalPadding = 8;
        this.info.links.forEach((link, ind) => {
            context.fillText(link, this.x + (this.width / 2), this.y + baseHeightOffset + (12 * ind) + verticalPadding);
        });
    }

    drawImageInfo(context) {
        let verticalPadding = 12;
        let lineHeight = 24;
        let currentLine = 1;
        this.setHeadingFont(context);
        context.fillText('Image Details', this.x + (this.width / 2), this.y + lineHeight);
        const urlLines = getTextAsLines(context, `URL: ${this.info.url}`, this.width, 4);
        urlLines.forEach(line => {
            context.fillText(line, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        });
        context.fillText(`Size: ${this.bytesToDisplay(this.info.bytes)}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        context.fillText(`Image Type: ${this.info.imageType}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
    }

    drawHtmlInfo(context) {
        let verticalPadding = 12;
        let lineHeight = 24;
        let currentLine = 1;
        this.setHeadingFont(context);
        context.fillText('Document Details', this.x + (this.width / 2), this.y + lineHeight);
        const urlLines = getTextAsLines(context, `URL: ${this.info.url}`, this.width, 4);
        urlLines.forEach(line => {
            context.fillText(line, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        });
        context.fillText(`Total classes: ${this.info.totalClasses}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        context.fillText(`Total Ids: ${this.info.totalIds}`, this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);

        if (this.info.links < 1) {
            return;
        }

        context.fillText('Referenced URLs:', this.x + (this.width / 2), this.y + (lineHeight * ++currentLine) + verticalPadding);
        this.setSubHeadingFont(context);
        let baseHeightOffset = lineHeight * ++currentLine;
        lineHeight = 12;
        verticalPadding = 8;
        let subLines = 1;
        this.info.links.forEach((link, ind) => {
            const linkLines = getTextAsLines(context, link, this.width, 4);
            linkLines.forEach(line => {
                context.fillText(line, this.x + (this.width / 2), this.y + baseHeightOffset + (lineHeight * ++subLines) + verticalPadding);
            });
        });

        const nodes = this.info.nodes.join(', ');
        const nodeLines = getTextAsLines(context, `Used Nodes: ${nodes}`, this.width, 4);
        nodeLines.forEach(line => {
            context.fillText(line, this.x + (this.width / 2), this.y + baseHeightOffset + (lineHeight * ++subLines) + verticalPadding);
        });
    }

    setHeadingFont(context) {
        context.fillStyle = 'white';
        context.font = '24px roboto';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
    }

    setSubHeadingFont(context) {
        context.fillStyle = 'white';
        context.font = '12px roboto';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
    }

    bytesToDisplay(bytes) {
        if (bytes < 1000) {
            return bytes + ' bytes';
        }
    
        if (bytes < 1000000) {
            return (bytes / 1000) + 'Kb';
        }
    
        if (bytes < 1000000000) {
            return (bytes / 1000000) + 'Mb';
        }
    
        return (bytes / 1000000000) + 'Gb';
    }
};
