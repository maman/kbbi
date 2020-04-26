import fetch from 'node-fetch';
import StreamingParser from 'parse5-sax-parser';
import {Stream, Readable} from 'stream';
import {resolve} from 'url';

const KBBI_URL = 'https://kbbi.kemdikbud.go.id';

export default class KBBI {
  private generateType(domElement: string, value: string) {
    switch (domElement) {
      case 'ol':
      case 'ul':
        if (value === 'sing') return 'abbreviation';
        if (value === 'v') return 'verb';
        if (value === 'n') return 'noun';
        if (value.includes('--')) return 'example';
        return 'translation'
      default:
        return 'text';
    }
  }
  private fetchStreamFromKBBI(text: string): Promise<Stream> {
    const url = resolve(KBBI_URL, `/entri/${text}`);
    return fetch(url).then(res => {
      if (res.ok) {
        res.body.setEncoding('utf-8');
        return res.body;
      };
      throw new Error(res.statusText);
    });
  }

  private createKBBIStreamingParser(stream: Stream): Stream {
    let currTag: string | null;
    const resultStream = new Readable();
    const parser = new StreamingParser();
    parser.on('startTag', (opt) => {
      // @ts-ignore
      if (
        opt.tagName === 'h2' ||
        opt.tagName === 'ol' ||
        (
          opt.tagName === 'ul' &&
          opt.attrs.find(attr => attr.name === 'class' && attr.value === 'adjusted-par')
        )
      ) {
        currTag = opt.tagName;
      }
    });
    parser.on('text', (opt) => {
      const value = opt.text.trim();
      if (currTag && value.length > 0 && value !== 'n') {
        resultStream.push(JSON.stringify({
          type: this.generateType(currTag, value),
          value,
        }));
      }
    });
    parser.on('endTag', (opt) => {
      if (currTag && opt.tagName === currTag) currTag = null;
      console.log(opt.tagName);
      if (opt.tagName === 'html') {
        console.log('finish pushing');
        resultStream.push(null);
      }
    });
    stream.pipe(parser);
    return resultStream;
  }

  getDefinition(text: string) {
    return this.fetchStreamFromKBBI(text)
      .then(htmlResultStream => this.createKBBIStreamingParser(htmlResultStream))
      .then(resultStream => {
        return new Promise(resolve => {
          const buffer: Array<{[k: string]: string}> = [];
          resultStream.on('data', (data) => {
            buffer.push(JSON.parse(data.toString()));
          });
          resultStream.on('end', () => {
            resolve(buffer);
          })
        });
      })
  }

}