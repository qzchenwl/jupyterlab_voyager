import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ABCWidgetFactory, DocumentRegistry, IDocumentWidget, DocumentWidget,
} from '@jupyterlab/docregistry';

import {
  ICommandPalette, InstanceTracker
} from '@jupyterlab/apputils';

import {
  PathExt
} from '@jupyterlab/coreutils';

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  Widget,
} from '@phosphor/widgets';

import {
  read
} from 'vega';

import {
  CreateVoyager, Voyager
} from 'datavoyager';

import "datavoyager/build/style.css";

const FACTORY = 'Voyager';

class VoyagerWidget extends Widget {
  constructor(context: DocumentRegistry.Context) {
    super();
    this.addClass("jp-Voyager");
    this._context = context;
    this._onTitleChanged();
    this._loadVoyager(this.node);
    this._context.pathChanged.connect(this._onTitleChanged, this);
    this._context.ready.then(() => { this._onContextReady(); });
  }

  private _loadVoyager(node: HTMLElement): void {
    this._voyager = CreateVoyager(node, {
      showDataSourceSelector: false,
      serverUrl: null,
      hideHeader: true,
      hideFooter: true,
      relatedViews: "initiallyShown",
      wildcards: "enabled"
    }, { values: [] });
  }

  private _onContextReady(): void {
    this._ready.resolve();
    const type = PathExt.extname(this._context.localPath).substr(1);
    const values = read(this._context.model.toString(), { type, parse: 'auto' });
    this._voyager.updateData({ values });
  }

  private _onTitleChanged(): void {
    this.title.label = PathExt.basename(this._context.localPath);
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  private _context: DocumentRegistry.Context;
  private _voyager: Voyager;
  private _ready = new PromiseDelegate<void>();

};

export
  class VoyagerFactory extends ABCWidgetFactory<IDocumentWidget<VoyagerWidget>> {
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    super(options);
  }

  protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): IDocumentWidget<VoyagerWidget> {
    return new DocumentWidget({ context, content: new VoyagerWidget(context) });
  }
}


/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  console.log('JupyterLab extension jupyterlab_voyager is activated!', app, palette, restorer);
  const namespace = 'voyager';
  const factory = new VoyagerFactory({ name: FACTORY, fileTypes: ['csv', 'json'] });
  const tracker = new InstanceTracker<IDocumentWidget<VoyagerWidget>>({ namespace });
  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  factory.widgetCreated.connect((sender, widget) => {
    widget.context.pathChanged.connect(() => {
      tracker.save(widget);
    });
    tracker.add(widget);
  });

  app.docRegistry.addWidgetFactory(factory);
};


/**
 * Initialization data for the jupyterlab_voyager extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_voyager',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;
