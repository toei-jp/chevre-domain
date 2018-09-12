// tslint:disable:no-implicit-dependencies
/**
 * 取引リポジトリーテスト
 */
import { } from 'mocha';
import * as assert from 'power-assert';
import * as sinon from 'sinon';
// tslint:disable-next-line:no-require-imports no-var-requires
require('sinon-mongoose');
import * as domain from '../index';

let sandbox: sinon.SinonSandbox;
let transactionRepo: domain.repository.Transaction;

before(() => {
    sandbox = sinon.createSandbox();
});

describe('取引を開始する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('MongoDBが正常であれば開始できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('create').once().resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.start(domain.factory.transactionType.Reserve, <any>{});
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });
});

describe('IDで取引を検索する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('取引が存在すればオブジェクトを取得できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOne').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.findById(domain.factory.transactionType.Reserve, 'transactionId');
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('存在しなければNotFoundエラーとなるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOne').once().chain('exec').resolves(null);

        const result = await transactionRepo.findById(domain.factory.transactionType.Reserve, 'transactionId').catch((err) => err);
        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('取引を確定する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('取引が存在すればオブジェクトを取得できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.confirm(domain.factory.transactionType.Reserve, 'transactionId', {}, <any>{});
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('すでに確認済であれば成功するはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Confirmed
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.confirm(domain.factory.transactionType.Reserve, 'transactionId', {}, <any>{});
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('取引が期限切れステータスであればArgumentエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Expired
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.confirm(domain.factory.transactionType.Reserve, 'transactionId', {}, <any>{})
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.Argument);
        sandbox.verify();
    });

    it('取引が中止済ステータスであればArgumentエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Canceled
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.confirm(domain.factory.transactionType.Reserve, 'transactionId', {}, <any>{})
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.Argument);
        sandbox.verify();
    });

    it('万が一確定時に存在せず、状態確認時に存在した場合NotFoundエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.InProgress
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.confirm(domain.factory.transactionType.Reserve, 'transactionId', {}, <any>{})
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('取引を中止する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('取引が存在すればオブジェクトを取得できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.cancel(domain.factory.transactionType.Reserve, 'transactionId');
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('すでに中止済であれば成功するはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Canceled
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.cancel(domain.factory.transactionType.Reserve, 'transactionId');
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('取引が期限切れステータスであればArgumentエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Expired
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.cancel(domain.factory.transactionType.Reserve, 'transactionId')
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.Argument);
        sandbox.verify();
    });

    it('取引が確定ステータスであればArgumentエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.Confirmed
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.cancel(domain.factory.transactionType.Reserve, 'transactionId')
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.Argument);
        sandbox.verify();
    });

    it('万が一中止時に存在せず、状態確認時に存在した場合NotFoundエラーとなるはず', async () => {
        const transaction = {
            status: domain.factory.transactionStatusType.InProgress
        };
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);
        sandbox.mock(transactionRepo).expects('findById').once().resolves(transaction);

        const result = await transactionRepo.cancel(domain.factory.transactionType.Reserve, 'transactionId')
            .catch((err) => err);
        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('取引タスクエクスポートを開始する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('取引が存在すればオブジェクトを取得できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.startExportTasks(
            domain.factory.transactionType.Reserve,
            domain.factory.transactionStatusType.Canceled
        );
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('取引が存在しなければnullが返されるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);

        const result = await transactionRepo.startExportTasks(
            domain.factory.transactionType.Reserve,
            domain.factory.transactionStatusType.Canceled
        );
        assert.equal(result, null);
        sandbox.verify();
    });
});

describe('取引タスクエクスポートリトライ', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('MongoDBが正常であればエクスポートステータスを変更できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.reexportTasks(1);
        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('IDでタスクをエクスポート済に変更する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('MongoDBが正常であればエクスポートステータスを変更できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new transactionRepo.transactionModel());

        const result = await transactionRepo.setTasksExportedById('transactionId');
        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('取引を期限切れにする', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('MongoDBが正常であればエクスポートステータスを変更できるはず', async () => {
        sandbox.mock(transactionRepo.transactionModel).expects('update').once()
            .chain('exec').resolves();

        const result = await transactionRepo.makeExpired(<any>{});
        assert.equal(result, undefined);
        sandbox.verify();
    });
});

describe('取引を検索する', () => {
    beforeEach(() => {
        sandbox.restore();
        transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    });

    it('MongoDBが正常であれば配列を取得できるはず', async () => {
        const searchConditions = {
            typeOf: domain.factory.transactionType.Reserve,
            startFrom: new Date(),
            startThrough: new Date()
        };
        sandbox.mock(transactionRepo.transactionModel).expects('find').once()
            .chain('exec').resolves([new transactionRepo.transactionModel()]);

        const result = await transactionRepo.search(searchConditions);
        assert(Array.isArray(result));
        sandbox.verify();
    });
});
