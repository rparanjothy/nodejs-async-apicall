val x= spark.read.csv("/home/rparanjo/thd/sorted.csv")
val x1=x.toDF("name","itemid")  
val ex=x1.select(explode(split('name,"-")).as("x"),'itemid).filter(length('x)>=3)
// val ex=x1.select(explode(split('name,"-")).as("x"),'itemid)
val byWord=ex.groupBy('x).agg(count(lit(1)).as("c"),collect_list('itemid).as("itemids"))      
// write to one big file
byWord.sort('c.desc).repartition(1).write.mode(SaveMode.Append).json("keywords")

def fil(n:String, fn:String="contains")= if (fn != "startsWith") byWord.filter(lower('x).startsWith(lower(lit(n)))).orderBy('c.desc).show() else byWord.filter(lower('x).contains(lower(lit(n)))).orderBy('c.desc).show()
 

val byWord=x.toDF("name","itemid").select(explode(split('name,"-")).as("x"),'itemid).filter(length('x)>0).groupBy('x).agg(count(lit(1)).as("c"),collect_list('itemid).as("itemids"))     

val byWord=x.toDF("name","itemid").select(explode(split('name,"-")).as("x"),'itemid).filter(length('x)>2).groupBy('x).agg(count(lit(1)).as("c")).orderBy('c.desc) 


// Streaming
spark.readStream.schema(catalog).csv("./thd/sort*.csv").select('name,'id).writeStream.format("console").start()
// note the * matters


import org.apache.spark.sql.types.StructType
//  Streaming needs a schema. its not smart 
val catalog=new StructType().add("name", "string").add("itemid", "integer")

// when using aggregates, output mode cannot be append, bc the values change in the table.
// each line coming is included in the aggregated result. so .. cant have append.
(
    spark.readStream.schema(catalog).csv("./thd/sort*.csv").select('name,'itemid)
    .select(explode(split('name,"-")).as("x"),'itemid)
    .filter('x === "paranjothy")
    .groupBy('x)
    .agg(collect_list('x).as("items"), count(lit(1)).as("ct"))
    .writeStream.outputMode("complete").format("console").start()
)

// 
// echo ram,2>>data3.csv
//  add a new file with data, then it triggers
import org.apache.spark.sql.streaming.Trigger
import org.apache.spark.sql.functions.current_timestamp

(
    spark.readStream.schema(catalog).csv("./streams-test/*.csv").select('name,'itemid)
    .withColumn("t",current_timestamp)
    .filter('name === "ram")
    .withWatermark("t", "1 minutes")
    .groupBy('name)
    // .agg(collect_list('itemid).as("items"), count(lit(1)).as("ct"))
    .agg( count(lit(1)).as("ct"))
    .writeStream
    // .trigger(Trigger.ProcessingTime("1 second"))
    .outputMode("complete")
    .format("console")
    .format("csv")
    .option("path","./aggs/")
    .option("checkpointLocation","./aggs/chkpoints")
    .start()
)


(
    spark.readStream.schema(catalog).csv("/mnt/c/pet-projects/thd-crawl/*.csv").select('name,'itemid)
    .select(explode(split('name,"-")).as("x"),'itemid)
    // .filter('x === "paranjothy")
    .groupBy('x)
    .agg(collect_list('x).as("items"), count(lit(1)).as("ct"))
    .writeStream.outputMode("complete").format("console").start()
)

val hist=byWord.select('c).map(e=>e.getLong(0)).rdd.histogram(100) 
case class histdata(clusterCount:Double, itemCount:Double)  
val histDF=(hist._1 zip hist._2).map(e=>histdata(e._1,e._2)).toSeq.toDF 
histDF.show