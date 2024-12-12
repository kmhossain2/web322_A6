// Export the module
module.exports = {
    initialize,
    getAllItems,
    getItemsByCategory,
    getItemsByMinDate,
    getItemsById,
    getPublishedItems,
    getPublishedItemsByCategory,
    getCategories,
    addItem,
    addCategory,
    deleteCategoryByID,
    deleteItemByID
}

// Import sequelize
const Sequelize = require('sequelize');

var sequelize = new Sequelize('webdb', 'webdb_owner', 'wo4ilAfbx3jV', {
    host: 'ep-misty-night-a5qleztu.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: { type: Sequelize.TEXT, allowNull: false },
    title: { type: Sequelize.STRING, allowNull: false },
    postDate: { type: Sequelize.DATE, allowNull: false },
    featureImage: { type: Sequelize.STRING, allowNull: false },
    published: { type: Sequelize.BOOLEAN, allowNull: false },
    price: { type: Sequelize.DOUBLE, allowNull: false }
});

const Category = sequelize.define('Category', {
    category: { type: Sequelize.STRING }
});

Item.belongsTo(Category, {foreignKey: 'category'});

// Exported Functions
function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then( () => resolve() )
            .catch(err => reject("unable to sync the database"));
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: categoryID,
            },
        })
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr),
                },
            },
        })
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}
function getItemsById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { id },
        })
            .then( (data) => resolve(data[0]) )
            .catch( () => reject("no results found") );
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true },
        })
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true, category: category },
        })
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then( (data) => resolve(data) )
            .catch( () => reject("no results found") );
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        try {
            itemData.published = (itemData.published) ? true : false;

            for (const prop in itemData) {
                if (itemData[prop] === "") {
                    itemData[prop] = null;
                }
            }

            itemData.postDate = new Date();

            Item.create(itemData)
                .then( (newItem) => resolve(newItem))
                .catch(err => reject("unable to post: " + err));
        }
        catch {
            reject('Failed to add item');
        }
    });
}

function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        for (const prop in categoryData) {
            if (categoryData[prop] === "") {
                categoryData[prop] = null;
            }
        }

        Category.create(categoryData)
            .then( () => resolve("Category created"))
            .catch ( () => reject("unable to create category") );
    });
}

function deleteCategoryByID(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id }})
            .then((count) => {
                if (count > 0) {
                    resolve("category deleted");
                } else {
                    reject("cannot find category with given id");
                }
            })
            .catch(() => {
                reject("unable to delete category");
            });
    })
}

function deleteItemByID(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id }})
            .then((count) => {
                if (count > 0) {
                    resolve("category deleted");
                } else {
                    reject("cannot find category with given id");
                }
            })
            .catch(() => {
                reject("unable to delete category");
            });
    })
}