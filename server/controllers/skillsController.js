const db = require('../models');
const Op = db.Sequelize.Op;

exports.getSkills = async (req, res) =>{

  try {
    const location = req.query.location;
    const categoryId = req.query.category_id;
    let skills;

    if (categoryId) {
      skills = await db.Skill.findAll({
        where:{
          location: location,
          fk_category_id: categoryId,
          deleted: 0
        },
        include: [db.User]
      });
    } else {
      skills = await db.Skill.findAll({
        where:{
          location: location,
          deleted: 0
        },
        include: [{model: db.User,
                  attributes : ['name', 'pk_user_id']}]
      });
    }

    const superSkills = skills.map(skill => {
      const newSkill = {...skill.dataValues,
        creator_name: skill.dataValues.User.dataValues.name,
        creator_id: skill.dataValues.User.dataValues.pk_user_id,
      }
      delete newSkill.User;
      delete newSkill.fk_user_id;
      return newSkill;
    });


    const shuffledSkills = await superSkills.sort((a,b) => {return 0.5 - Math.random();});
    // const skills = shuffled.slice(0,15);
    res.status(200).send(shuffledSkills);
  } catch (e) {
    res.status(404).send(e);
  }
};

exports.getSkill = async (req, res) =>{
  try {
    const skillId = req.params.id;
    const skill = await db.Skill.findOne({
      where:{
        pk_skill_id: skillId,
        deleted: 0
      }
    }).then((skill) => {
    return skill.increment('counter_visits');
    })
    const conversations = await db.Conversation.findAll({
      where: { fk_skill_id: skill.pk_skill_id}
    });
    if (conversations.length > 0) {
      const conversationsId = conversations.map(conversation => conversation.pk_conversation_id)

      const reviews = await db.Review.findAll({
        where: {
        fk_conversation_id: { [Op.or]: conversationsId}
        },
        include: [{
          model: db.Conversation,
          include: [{
            model: db.User,
            attributes: ['name', 'surname', 'img_url', 'pk_user_id']
          }]
        }],
        order: [['time_stamp', 'DESC']]
      });

      const filteredReviews = reviews.map( review => {
        const filteredReview = {
          ...review.dataValues,
          sender_id: review.dataValues.Conversation.User.pk_user_id,
          sender_name: review.dataValues.Conversation.User.name,
          sender_surname: review.dataValues.Conversation.User.surname,
          sender_img_url: review.dataValues.Conversation.User.img_url
        }
        delete filteredReview.Conversation;
        return filteredReview
      })
       skill.dataValues.reviews = filteredReviews;
   } else {
     skill.dataValues.reviews =[];
   }

   res.status(200).send(skill);
  } catch (e) {
    res.status(404).send(e);
  }
};


exports.createSkill = async (req, res) =>{
  try {
    await db.Skill.create({
      title: req.body.title,
      description: req.body.description,
      img_url: req.body.img_url,
      location: req.body.location,
      fk_user_id: req.body.fk_user_id,
      fk_category_id: req.body.fk_category_id,
      deleted: 0,
      counter_visits: 0
    });
    res.status(201).send({response: 'Skill created'});
  } catch (e) {
    res.status(404).send(e);
  }

};

exports.deleteSkill = async (req, res) =>{
  try {
    const skillId = req.params.id;
    await db.Skill.update({
      deleted: 1}, {
      where:{
        pk_skill_id: skillId
      }
    });
    res.status(200).send('Deleted!');
  } catch (e) {
    res.status(404).send(e);
  }
};
