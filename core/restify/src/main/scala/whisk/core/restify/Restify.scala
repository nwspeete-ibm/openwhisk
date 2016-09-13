/*
 * Copyright 2015-2016 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package whisk.core.restify

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import akka.stream.ActorMaterializer

import java.lang.Thread


object Restify {
  def main(args: Array[String]) {

    implicit val system = ActorSystem("restify-actor-system")
    implicit val materializer = ActorMaterializer()
    // needed for the future flatMap/onComplete in the end
    implicit val executionContext = system.dispatcher

    val route =
      path("hello") {
        get {
          //complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "Hello, World"))
          complete("Hello, World")
        }
      }~
      path("ping") {
        get {
          complete("pong")
        }
      }

    val bindingFuture = Http().bindAndHandle(route, "0.0.0.0", 8080)

    println(s"Restify server running at http://localhost:8080/")
    while (true) {
      println(s"Server sleeping...")
      Thread.sleep(60000)
    }
    println(s"Server stopping...")
    bindingFuture
      .flatMap(_.unbind()) // trigger unbinding from the port
    //FIXME MWD  .onComplete(_ => system.terminate()) // and shutdown when done
  }
}

